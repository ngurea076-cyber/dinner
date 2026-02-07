import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Missing orderId");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: dbError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (dbError || !order) {
      throw new Error("Order not found");
    }

    if (order.payment_status !== "paid") {
      throw new Error("Can only resend tickets for paid orders");
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const ticketHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
        <div style="background: linear-gradient(135deg, #6A0DAD, #4a0080); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">WOMENS DAY DINNER</h1>
          <p style="color: #d4b3ff; margin: 8px 0 0; font-size: 14px;">Womens Day DInner</p>
        </div>
        <div style="display:flex;align-items:center;gap:20px;padding:30px;">
          <div style="flex:0 0 150px;text-align:center;">
            <img src="https://quickchart.io/qr?text=${order.qr_code}&size=300" alt="QR code" style="width:130px;height:130px;border-radius:8px;" />
          </div>
          <div style="flex:1;">
            <h2 style="color: #6A0DAD; margin-top: 0;">🎟 Your Ticket (Resent)</h2>
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
      console.error("Email error:", emailError);
      throw new Error("Failed to send email");
    }

    console.log(`Ticket resent to ${order.email} for order ${order.ticket_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ticket sent to ${order.email}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Resend ticket error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
