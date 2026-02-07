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
    const { fullName, email, phone, quantity } = await req.json();

    // Validate inputs
    if (!fullName || !email || !phone || !quantity) {
      throw new Error("Missing required fields");
    }

    if (!/^254[17]\d{8}$/.test(phone)) {
      throw new Error("Invalid phone format. Use 2547XXXXXXXX or 2541XXXXXXXX");
    }

    const ticketPrice = 1;
    const totalAmount = ticketPrice * quantity;
    const ticketId = crypto.randomUUID().split("-")[0].toUpperCase();
    const qrCode = crypto.randomUUID();
    const reference = `WDD-${ticketId}`;

    console.log(
      `Creating order: ${ticketId} for ${fullName}, amount: ${totalAmount}`,
    );

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Insert order
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        full_name: fullName,
        email,
        phone,
        ticket_type: "single",
        quantity,
        total_amount: totalAmount,
        ticket_id: ticketId,
        qr_code: qrCode,
        payment_status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to create order");
    }

    console.log(`Order created: ${order.id}, initiating STK push...`);

    // Initiate HashPay STK Push
    const apiKey = Deno.env.get("HASHPAY_API_KEY");
    const accountId = Deno.env.get("HASHPAY_ACCOUNT_ID");

    console.log(
      `HashPay config - API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`,
    );
    console.log(
      `HashPay config - Account ID present: ${!!accountId}, value: ${accountId}`,
    );

    const stkPayload = {
      api_key: apiKey,
      account_id: accountId,
      amount: String(totalAmount),
      msisdn: phone,
      reference: encodeURIComponent(reference),
    };
    console.log(
      "STK payload (without api_key):",
      JSON.stringify({ ...stkPayload, api_key: "[REDACTED]" }),
    );

    const stkResponse = await fetch("https://api.hashback.co.ke/initiatestk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();
    console.log("STK push response:", JSON.stringify(stkResult));

    const stkSuccess =
      stkResult.ResponseCode === "0" || stkResult.ResponseCode === 0;
    if (!stkSuccess) {
      // Update order to failed
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      throw new Error(
        stkResult.ResponseDescription || stkResult.message || "STK push failed",
      );
    }

    const checkoutId = stkResult.CheckoutRequestID || stkResult.checkout_id;
    await supabase
      .from("orders")
      .update({ checkout_id: checkoutId })
      .eq("id", order.id);

    console.log(`STK push successful, checkout_id: ${checkoutId}`);

    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        qrCode,
        checkoutId: checkoutId,
        orderId: order.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in create-order:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
