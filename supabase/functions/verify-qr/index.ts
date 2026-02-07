import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const qr = body?.qr;
    const ticketId = body?.ticketId;
    const mark = body?.mark === true;
    if (!qr && !ticketId)
      return new Response(
        JSON.stringify({ success: false, error: "Missing qr or ticketId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("orders")
      .select(
        "id, ticket_id, full_name, email, payment_status, qr_code, scanned, scanned_at",
      );

    if (ticketId) {
      query = query.eq("ticket_id", ticketId);
    } else {
      query = query.eq("qr_code", qr);
    }

    const { data: order, error: findError } = await query.maybeSingle();

    if (findError) throw findError;
    if (!order)
      return new Response(
        JSON.stringify({ success: false, error: "Ticket not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );

    // If mark flag isn't set, just return order info without updating
    if (!mark) {
      return new Response(
        JSON.stringify({
          success: true,
          status: order.scanned ? "already_scanned" : "not_scanned",
          ticket: order,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If already scanned
    if (order.scanned) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "already_scanned",
          scannedAt: order.scanned_at,
          ticket: order,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ scanned: true, scanned_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) throw updateError;

    // Fetch updated ticket to return
    const { data: updated, error: updatedErr } = await supabase
      .from("orders")
      .select(
        "id, ticket_id, full_name, email, payment_status, qr_code, scanned, scanned_at",
      )
      .eq("id", order.id)
      .maybeSingle();

    if (updatedErr) throw updatedErr;

    return new Response(
      JSON.stringify({ success: true, status: "scanned", ticket: updated }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("verify-qr error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
