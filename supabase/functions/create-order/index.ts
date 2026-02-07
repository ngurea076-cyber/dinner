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

    if (!/^2547\d{8}$/.test(phone)) {
      throw new Error("Invalid phone format. Use 2547XXXXXXXX");
    }

    const ticketPrice = 1;
    const totalAmount = ticketPrice * quantity;
    const ticketId = crypto.randomUUID().split("-")[0].toUpperCase();
    const reference = `PN-${ticketId}`;

    console.log(`Creating order: ${ticketId} for ${fullName}, amount: ${totalAmount}`);

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
    const stkResponse = await fetch("https://api.hashback.co.ke/initiatestk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: Deno.env.get("HASHPAY_API_KEY"),
        account_id: Deno.env.get("HASHPAY_ACCOUNT_ID"),
        amount: String(totalAmount),
        msisdn: phone,
        reference: encodeURIComponent(reference),
      }),
    });

    const stkResult = await stkResponse.json();
    console.log("STK push response:", JSON.stringify(stkResult));

    if (!stkResult.success) {
      // Update order to failed
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      throw new Error(stkResult.message || "STK push failed");
    }

    // Save checkout_id for tracking
    await supabase
      .from("orders")
      .update({ checkout_id: stkResult.checkout_id })
      .eq("id", order.id);

    console.log(`STK push successful, checkout_id: ${stkResult.checkout_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        checkoutId: stkResult.checkout_id,
        orderId: order.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-order:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
