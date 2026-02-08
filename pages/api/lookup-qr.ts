import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { qr, ticketId } = req.body;

    if (!qr && !ticketId) {
      return res.status(400).json({ success: false, error: 'Missing qr or ticketId' });
    }

    let query = {};
    if (ticketId) {
      query.ticket_id = ticketId.trim();
    } else {
      query.qr_code = qr.trim();
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    return res.status(200).json({ success: true, ticket: order });
  } catch (error) {
    console.error('lookup-qr error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}