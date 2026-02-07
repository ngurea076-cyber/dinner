import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { ticketId, checkoutId } = await req.json();

    if (!ticketId && !checkoutId) {
      throw new Error("Provide ticketId or checkoutId");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // First check local DB status
    let query = supabase.from("orders").select("*");
    if (ticketId) {
      query = query.eq("ticket_id", ticketId);
    } else {
      query = query.eq("checkout_id", checkoutId);
    }

    const { data: order, error: dbError } = await query.maybeSingle();

    if (dbError || !order) {
      console.error("Order lookup failed:", dbError);
      throw new Error("Order not found");
    }

    // If already paid or failed, return immediately
    if (order.payment_status !== "pending") {
      return new Response(
        JSON.stringify({
          success: true,
          status: order.payment_status,
          ticketId: order.ticket_id,
          fullName: order.full_name,
          ticketType: order.ticket_type,
          quantity: order.quantity,
          total: order.total_amount,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Poll HashPay for status if still pending and we have a checkout_id
    if (order.checkout_id) {
      console.log(`Checking HashPay status for checkout: ${order.checkout_id}`);

      const statusResponse = await fetch("https://api.hashback.co.ke/transactionstatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: Deno.env.get("HASHPAY_API_KEY"),
          account_id: Deno.env.get("HASHPAY_ACCOUNT_ID"),
          checkoutid: order.checkout_id,
        }),
      });

      const statusResult = await statusResponse.json();
      console.log("HashPay status result:", JSON.stringify(statusResult));

      if (statusResult.ResultCode === "0" || statusResult.ResultCode === 0) {
        // Payment confirmed
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            transaction_id: statusResult.TransactionID || null,
          })
          .eq("id", order.id);

        return new Response(
          JSON.stringify({
            success: true,
            status: "paid",
            ticketId: order.ticket_id,
            fullName: order.full_name,
            ticketType: order.ticket_type,
            quantity: order.quantity,
            total: order.total_amount,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check for explicit failure codes
      if (statusResult.ResultCode && statusResult.ResultCode !== "0" && statusResult.ResultCode !== 0) {
        const resultCode = String(statusResult.ResultCode);
        // Codes like 1032 (cancelled), 1037 (timeout), 2001 (wrong pin) indicate failure
        if (["1032", "1037", "2001", "1"].includes(resultCode)) {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);

          return new Response(
            JSON.stringify({
              success: true,
              status: "failed",
              message: statusResult.ResultDesc || "Payment failed",
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    // Still pending
    return new Response(
      JSON.stringify({ success: true, status: "pending" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Check payment error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
