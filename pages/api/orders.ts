import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { ticketId } = req.query;

    if (ticketId) {
      // Fetch specific order by ticketId
      const order = await Order.findOne({ ticket_id: ticketId });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      return res.status(200).json({ success: true, order });
    } else {
      // Fetch all orders (existing functionality)
      const orders = await Order.find({}).sort({ created_at: -1 });
      return res.status(200).json(orders);
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}