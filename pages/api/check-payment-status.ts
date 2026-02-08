import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../lib/mongodb';
import Order from '../../lib/models/Order';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { ticketId } = req.query;

    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(400).json({ success: false, error: 'Ticket ID is required' });
    }

    await connectToDatabase();

    const order = await Order.findOne({ ticket_id: ticketId });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const response: {
      success: boolean;
      payment_status: string;
      ticket_id: string;
      email_status?: 'sent' | 'failed' | 'error';
    } = {
      success: true,
      payment_status: order.payment_status,
      ticket_id: order.ticket_id,
    };

    // If payment is now paid and we haven't sent email yet, send it
    if (order.payment_status === 'paid') {
      // Check if we should send email (you might want to add a flag to prevent duplicate emails)
      console.log(`Payment confirmed for ticket ${ticketId}, sending email...`);

      try {
        const ticketHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
            <div style="background: linear-gradient(135deg, #6A0DAD, #4a0080); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">WOMENS DAY DINNER</h1>
              <p style="color: #d4b3ff; margin: 8px 0 0; font-size: 14px;">Womens Day DInner</p>
            </div>
            <div style="display:flex;align-items:center;gap:20px;padding:30px;">
              <div style="flex:0 0 150px;text-align:center;">
                <img src="https://quickchart.io/qr?text=${encodeURIComponent(order.qr_code)}&size=300" alt="QR code" style="width:130px;height:130px;border-radius:8px;" />
              </div>
              <div style="flex:1;">
                <h2 style="color: #6A0DAD; margin-top: 0;">🎟 Your Ticket is Confirmed!</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket ID</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; font-family: monospace; color: #6A0DAD;">${order.ticket_id}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${order.full_name}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket Type</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; text-transform: capitalize;">${order.ticket_type}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Quantity</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${order.quantity}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Total Paid</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #6A0DAD;">KES ${order.total_amount.toLocaleString()}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">M-Pesa Ref</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace;">${order.transaction_id || "N/A"}</td></tr>
              </table>
              <div style="background: #f8f0ff; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #666; margin: 0 0 8px; font-size: 13px;">Event Details</p>
                <p style="margin: 0; font-weight: bold; color: #333;">📅 March 7, 2026 — 3:00 PM - 10:00 PM</p>
                <p style="margin: 4px 0 0; color: #666;">
                  <a href="https://www.google.com/maps/place/Radisson+Blu+Hotel,+Nairobi+Upper+Hill/@-1.3015887,36.8173125,16z/data=!4m9!3m8!1s0x182f10e51817c5bd:0x3a9709be7741fa63!5m2!4m1!1i2!8m2!3d-1.3022805!4d36.8167439!16s%2Fg%2F11b6jddqjw?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D" target="_blank" style="color: #6A0DAD; text-decoration: none;">
                    Radisson Blue UpperHill
                  </a>
                </p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Please present this email or your Ticket ID at the entrance.</p>
            </div>
          </div>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "Womens Day DInner <tickets@dinner.bidiigirlsprogramme.org>",
          to: [order.email],
          subject: `🎟 Your Ticket for Womens Day DInner — ${order.ticket_id}`,
          html: ticketHtml,
        });

        if (emailError) {
          console.error("Email send error:", emailError);
          response.email_status = 'failed';
        } else {
          console.log(`Ticket email sent to ${order.email} for ticket ${order.ticket_id}`);
          response.email_status = 'sent';
        }
      } catch (emailErr: unknown) {
        if (emailErr instanceof Error) {
          console.error("Email error:", emailErr.message);
        } else {
          console.error("Email error:", emailErr);
        }
        response.email_status = 'error';
      }
    }

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error('Check payment status error:', error);
    let message = 'Unknown error';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      try {
        message = JSON.stringify(error);
      } catch {
        // keep default message
      }
    }
    res.status(500).json({ success: false, error: message });
  }
}