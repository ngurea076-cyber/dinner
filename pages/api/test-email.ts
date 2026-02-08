import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { data, error } = await resend.emails.send({
      from: "Womens Day DInner <tickets@dinner.bidiigirlsprogramme.org>",
      to: [email],
      subject: "Test Email - Ticket System",
      html: "<h1>Test Email</h1><p>This is a test email to verify the email system is working.</p>",
    });

    if (error) {
      console.error("Test email error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log("Test email sent successfully:", data);
    return res.status(200).json({ success: true, message: "Test email sent", data });
  } catch (error: any) {
    console.error('Test email error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}