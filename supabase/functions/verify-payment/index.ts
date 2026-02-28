import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, user_id, plan } = await req.json();

    if (!reference || !user_id || !plan) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SERCET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SERCET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the transaction with Paystack
    console.log("Verifying payment with reference:", reference);
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Paystack verification response:", verifyData.status, verifyData.message);

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(
        JSON.stringify({ error: "Payment verification failed", details: verifyData.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract tier from the payment reference (format: "plus_monthly_userid_timestamp" or "pro_yearly_...")
    const refParts = reference.split("_");
    const tier = refParts[0] === "plus" ? "plus" : refParts[0] === "pro" ? "pro" : null;
    if (!tier) {
      return new Response(
        JSON.stringify({ error: "Invalid payment reference: could not determine tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate subscription expiry based on plan
    const now = new Date();
    let expiresAt: Date;
    
    if (plan === "yearly") {
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    }

    // Update user's subscription in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Also reset any expired subscriptions for this user before setting new one
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Subscription updated successfully for user:", user_id);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription activated",
        expires_at: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
