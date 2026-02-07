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
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload));

    const {
      ResponseCode,
      CheckoutRequestID,
      TransactionID,
      TransactionAmount,
      TransactionReceipt,
      TransactionReference,
    } = payload;

    if (ResponseCode === undefined) {
      throw new Error("Invalid webhook payload");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find order by checkout_id
    const checkoutId = CheckoutRequestID;
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (findError || !order) {
      console.error("Order not found for checkout_id:", checkoutId, findError);
      return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prevent duplicate processing
    if (order.payment_status === "paid") {
      console.log("Order already paid, skipping:", order.ticket_id);
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isPaid = ResponseCode === 0 || ResponseCode === "0";
    const newStatus = isPaid ? "paid" : "failed";

    // Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: newStatus,
        transaction_id: TransactionID || TransactionReceipt || null,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      throw new Error("Failed to update order status");
    }

    console.log(`Order ${order.ticket_id} updated to ${newStatus}`);

    // Send ticket email if paid
    if (isPaid) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        const ticketHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
            <div style="background: linear-gradient(135deg, #6A0DAD, #4a0080); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">PURPLE NIGHTS</h1>
              <p style="color: #d4b3ff; margin: 8px 0 0; font-size: 14px;">Valentine's Edition</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #6A0DAD; margin-top: 0;">🎟 Your Ticket is Confirmed!</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket ID</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; font-family: monospace; color: #6A0DAD;">${order.ticket_id}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${order.full_name}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Ticket Type</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; text-transform: capitalize;">${order.ticket_type}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Quantity</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${order.quantity}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Total Paid</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #6A0DAD;">KES ${order.total_amount.toLocaleString()}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">M-Pesa Ref</td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-family: monospace;">${TransactionReceipt || TransactionID || 'N/A'}</td></tr>
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
          console.error("Email send error:", emailError);
        } else {
          console.log(`Ticket email sent to ${order.email}`);
        }
      } catch (emailErr: any) {
        console.error("Email error:", emailErr.message);
        // Don't fail the webhook if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
