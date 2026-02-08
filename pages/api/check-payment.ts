import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { ticketId, checkoutId } = req.body;

    if (!ticketId && !checkoutId) {
      throw new Error('Provide ticketId or checkoutId');
    }

    await connectToDatabase();

    let query = {};
    if (ticketId) {
      query = { ticket_id: ticketId };
    } else {
      query = { checkout_id: checkoutId };
    }

    const order = await Order.findOne(query);

    if (!order) {
      throw new Error('Order not found');
    }

    // If already paid or failed, return immediately
    if (order.payment_status !== 'pending') {
      return res.status(200).json({
        success: true,
        status: order.payment_status,
        ticketId: order.ticket_id,
        fullName: order.full_name,
        ticketType: order.ticket_type,
        quantity: order.quantity,
        total: order.total_amount,
      });
    }

    // Poll HashPay for status if still pending and we have a checkout_id
    if (order.checkout_id) {
      console.log(`Checking HashPay status for checkout: ${order.checkout_id}`);

      const statusResponse = await fetch('https://api.hashback.co.ke/transactionstatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.HASHPAY_API_KEY,
          account_id: process.env.HASHPAY_ACCOUNT_ID,
          checkoutid: order.checkout_id,
        }),
      });

      const statusResult = await statusResponse.json();
      console.log('HashPay status result:', JSON.stringify(statusResult));

      if (statusResult.ResultCode === '0' || statusResult.ResultCode === 0) {
        // Payment confirmed
        await Order.findByIdAndUpdate(order._id, {
          payment_status: 'paid',
          transaction_id: statusResult.TransactionID || null,
        });

        // TODO: Send ticket email
        // For now, just return success

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
        return res.status(200).json({
          success: true,
          status: 'paid',
          ticketId: order.ticket_id,
          fullName: order.full_name,
          ticketType: order.ticket_type,
          quantity: order.quantity,
          total: order.total_amount,
        });
      }
    }

    // Still pending
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.status(200).json({
      success: true,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Error in check-payment:', error.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.status(400).json({ success: false, error: error.message });
  }
}