import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';

console.log('MONGODB_URI in API:', process.env.MONGODB_URI);


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
    console.log('Received create-order request:', req.body);
    const { fullName, email, phone, quantity } = req.body;

    // Validate inputs
    if (!fullName || !email || !phone || !quantity) {
      throw new Error('Missing required fields');
    }

    if (!/^0[17]\d{8}$/.test(phone)) {
      throw new Error('Invalid phone format. Use 07XXXXXXXX or 01XXXXXXXX');
    }

    // Convert 07 or 01 format to 2547 or 2541 for M-Pesa
    const formattedPhone = phone.replace(/^0/, '254');

    const ticketPrice = 1;
    const totalAmount = ticketPrice * quantity;
    const ticketId = crypto.randomUUID().split('-')[0].toUpperCase();
    const qrCode = crypto.randomUUID();
    const reference = `WDD-${ticketId}`;

    console.log(`Creating order: ${ticketId} for ${fullName}, amount: ${totalAmount}`);

    // Connect to MongoDB
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    // Create order
    console.log('Creating order document...');
    const order = new Order({
      full_name: fullName,
      email,
      phone,
      ticket_type: 'single',
      quantity,
      total_amount: totalAmount,
      ticket_id: ticketId,
      qr_code: qrCode,
      payment_status: 'pending',
    });

    console.log('Saving order to database...');
    await order.save();
    console.log(`Order saved successfully: ${order._id}`);

    console.log(`Order created: ${order._id}, initiating STK push...`);

    let checkoutId = 'test'; // Default fallback

    try {
      // Initiate HashPay STK Push
      const apiKey = process.env.HASHPAY_API_KEY;
      const accountId = process.env.HASHPAY_ACCOUNT_ID;

      console.log(`HashPay config - API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);
      console.log(`HashPay config - Account ID present: ${!!accountId}, value: ${accountId}`);

      const stkPayload = {
        api_key: apiKey,
        account_id: accountId,
        amount: String(totalAmount),
        msisdn: formattedPhone,
        reference: encodeURIComponent(reference),
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/hashpay-webhook`,
      };
      console.log('Callback URL:', stkPayload.callback_url);
      console.log('STK payload (without api_key):', JSON.stringify({ ...stkPayload, api_key: '[REDACTED]' }));

      const stkResponse = await fetch('https://api.hashback.co.ke/initiatestk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stkPayload),
      });

      const stkResult = await stkResponse.json();
      console.log('STK push response:', JSON.stringify(stkResult));

      const stkSuccess = stkResult.ResponseCode === '0' || stkResult.ResponseCode === 0;
      if (stkSuccess) {
        checkoutId = stkResult.CheckoutRequestID || stkResult.checkout_id;
        await Order.findByIdAndUpdate(order._id, { checkout_id: checkoutId });
        console.log(`STK push successful, checkout_id: ${checkoutId}`);
      } else {
        console.log(`STK push failed: ${stkResult.ResponseDescription || stkResult.message}`);
        // Keep checkoutId as 'test'
      }
    } catch (stkError: unknown) {
      console.error('STK push error:', stkError instanceof Error ? stkError.message : String(stkError));
      // Keep checkoutId as 'test'
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.status(200).json({
      success: true,
      ticketId,
      qrCode,
      checkoutId: checkoutId,
      orderId: order._id.toString(),
      message: "STK push initiated. Please check your phone and complete the payment.",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-order API:', errorMessage);
    console.error('Full error object:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.status(400).json({ success: false, error: errorMessage });
  }
}