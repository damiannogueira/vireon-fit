import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { gymId, userIds } = await req.json();

    // Validate input
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      !gymId || typeof gymId !== "string" || !UUID_RE.test(gymId) ||
      !Array.isArray(userIds) || userIds.length === 0 || userIds.length > 500 ||
      !userIds.every((u) => typeof u === "string" && UUID_RE.test(u))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid gymId or userIds" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify caller is gym admin
    const { data: isAdmin } = await supabaseAuth.rpc("is_gym_admin", {
      _user_id: user.id,
      _gym_id: gymId,
    });
    const { data: isSuperAdmin } = await supabaseAuth.rpc("is_super_admin", {
      _user_id: user.id,
    });

    if (!isAdmin && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch gym name server-side (no spoofing from client)
    const { data: gymRow } = await supabaseAuth
      .from("gyms")
      .select("name")
      .eq("id", gymId)
      .maybeSingle();
    const gymName = gymRow?.name || "Tu gimnasio";

    // Validate userIds belong to this gym
    const { data: validMembers } = await supabaseAuth
      .from("gym_members")
      .select("user_id")
      .eq("gym_id", gymId)
      .eq("is_active", true)
      .in("user_id", userIds);
    const validIds = (validMembers || []).map((m: { user_id: string }) => m.user_id);

    if (validIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid recipients in this gym" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create in-app notifications for each user
    const notifications = validIds.map((userId: string) => ({
      user_id: userId,
      gym_id: gymId,
      type: "payment_reminder",
      title: `💳 Recordatorio de pago — ${gymName || "Tu gimnasio"}`,
      message: `Tu cuota del mes está pendiente de pago. Acercate a recepción o consultá con tu admin.`,
      metadata: {
        period: new Date().toISOString().slice(0, 7),
        sent_by: user.id,
      },
    }));

    const { error: insertError } = await supabaseAuth
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create notifications" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to send emails if RESEND_API_KEY is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = 0;

    if (resendKey) {
      // Get user emails
      const emailResults = await Promise.allSettled(
        validIds.map(async (userId: string) => {
          const {
            data: { user: targetUser },
          } = await supabaseAuth.auth.admin.getUserById(userId);
          if (!targetUser?.email) return;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Vireon Fit <noreply@vireonfit.com>",
              to: targetUser.email,
              subject: `💳 Recordatorio de pago — ${gymName || "Tu gimnasio"}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #10B981;">Recordatorio de Pago</h2>
                  <p>Hola,</p>
                  <p>Te recordamos que tu cuota del mes en <strong>${gymName || "tu gimnasio"}</strong> está pendiente de pago.</p>
                  <p>Acercate a recepción o contactá a tu admin para regularizar tu situación.</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                  <p style="color: #9ca3af; font-size: 12px;">Vireon Fit — Tu entrenamiento, tu progreso.</p>
                </div>
              `,
            }),
          });
          if (res.ok) emailsSent++;
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: validIds.length,
        emailsSent,
        emailsEnabled: !!resendKey,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
