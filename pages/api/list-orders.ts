import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Get all orders
    const orders = await Order.find({}).sort({ created_at: -1 });

    // Group by payment status
    const stats = {
      total: orders.length,
      paid: orders.filter(o => o.payment_status === 'paid').length,
      pending: orders.filter(o => o.payment_status === 'pending').length,
      failed: orders.filter(o => o.payment_status === 'failed').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      orders: orders.map(order => ({
        id: order._id,
        ticket_id: order.ticket_id,
        full_name: order.full_name,
        email: order.email,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        transaction_id: order.transaction_id,
        qr_code: order.qr_code ? 'present' : 'missing',
        created_at: order.created_at,
      }))
    });
  } catch (error: unknown) {
    console.error('List orders error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: message });
  }
}