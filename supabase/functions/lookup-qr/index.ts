import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const qr = body?.qr;
    const ticketId = body?.ticketId;
    if (!qr && !ticketId) return new Response(JSON.stringify({ success: false, error: "Missing qr or ticketId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let query = supabase
      .from("orders")
      .select("id, ticket_id, full_name, email, payment_status, qr_code, scanned, scanned_at");

    if (ticketId) {
      query = query.eq("ticket_id", ticketId);
    } else {
      query = query.eq("qr_code", qr);
    }

    const { data: order, error: findError } = await query.maybeSingle();

    if (findError) throw findError;
    if (!order) return new Response(JSON.stringify({ success: false, error: "Ticket not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, ticket: order }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("lookup-qr error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
