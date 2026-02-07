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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">PURPLE NIGHTS</h1>
          <p style="color: #d4b3ff; margin: 8px 0 0; font-size: 14px;">Valentine's Edition</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #6A0DAD; margin-top: 0;">🎟 Your Ticket (Resent)</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket ID</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; font-family: monospace; color: #6A0DAD;">${order.ticket_id}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${order.full_name}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket Type</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; text-transform: capitalize;">${order.ticket_type}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Quantity</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${order.quantity}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Total Paid</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #6A0DAD;">KES ${order.total_amount.toLocaleString()}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">M-Pesa Ref</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace;">${order.transaction_id || 'N/A'}</td></tr>
          </table>
          <div style="background: #f8f0ff; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #666; margin: 0 0 8px; font-size: 13px;">Event Details</p>
            <p style="margin: 0; font-weight: bold; color: #333;">📅 February 14, 2026 — 8:00 PM</p>
            <p style="margin: 4px 0 0; color: #666;">The Grand Rooftop Lounge, Westlands, Nairobi</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Please present this email or your Ticket ID at the entrance.</p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "Purple Nights <onboarding@resend.dev>",
      to: [order.email],
      subject: `🎟 Your Ticket for Purple Nights — ${order.ticket_id}`,
      html: ticketHtml,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw new Error("Failed to send email");
    }

    console.log(`Ticket resent to ${order.email} for order ${order.ticket_id}`);

    return new Response(
      JSON.stringify({ success: true, message: `Ticket sent to ${order.email}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Resend ticket error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
