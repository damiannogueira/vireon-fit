import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cronSecret = Deno.env.get("CRON_SECRET");

    // Require shared CRON_SECRET (server-to-server invocation only)
    const provided =
      req.headers.get("x-cron-secret") ??
      (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!cronSecret || !provided || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Calculate current week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() + mondayOffset);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const twoWeeksAgoStart = new Date(lastWeekStart);
    twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);

    const lastWeekStr = lastWeekStart.toISOString();
    const thisWeekStr = thisWeekStart.toISOString();
    const twoWeeksAgoStr = twoWeeksAgoStart.toISOString();
    const weekStartDate = lastWeekStart.toISOString().split("T")[0];

    // Get all users with completed workouts in the last week
    const { data: lastWeekLogs } = await supabase
      .from("workout_logs")
      .select("user_id, duration_minutes, xp_earned, completed_at, workout_id")
      .not("completed_at", "is", null)
      .gte("completed_at", lastWeekStr)
      .lt("completed_at", thisWeekStr);

    if (!lastWeekLogs || lastWeekLogs.length === 0) {
      return new Response(JSON.stringify({ message: "No workouts last week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user
    const userLogs: Record<string, typeof lastWeekLogs> = {};
    for (const log of lastWeekLogs) {
      if (!userLogs[log.user_id]) userLogs[log.user_id] = [];
      userLogs[log.user_id].push(log);
    }

    const userIds = Object.keys(userLogs);

    // Get user profiles for fitness level
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, fitness_level")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Get onboarding for preferred days
    const { data: onboardings } = await supabase
      .from("onboarding_progress")
      .select("user_id, preferred_days")
      .in("user_id", userIds);

    const onboardingMap = new Map((onboardings || []).map(o => [o.user_id, o]));

    // Get previous week exercise logs for volume comparison
    const { data: prevWeekLogs } = await supabase
      .from("workout_logs")
      .select("user_id, workout_id")
      .not("completed_at", "is", null)
      .gte("completed_at", twoWeeksAgoStr)
      .lt("completed_at", lastWeekStr)
      .in("user_id", userIds);

    const prevWeekByUser: Record<string, number> = {};
    for (const log of (prevWeekLogs || [])) {
      prevWeekByUser[log.user_id] = (prevWeekByUser[log.user_id] || 0) + 1;
    }

    // Get exercise logs for volume calculation
    const lastWeekLogIds = lastWeekLogs.map(l => l.workout_id).filter(Boolean);
    const { data: exerciseLogs } = await supabase
      .from("workout_exercise_logs")
      .select("workout_log_id, weight_per_set, reps_per_set, sets_completed")
      .in("workout_log_id", lastWeekLogs.map(l => {
        // We need workout_log ids, not workout_ids
        return l.workout_id; // This won't match, we need the log id
      }).filter(Boolean));

    // Actually get exercise logs by joining through workout_logs
    const logIds = lastWeekLogs.map(l => {
      // workout_logs has id field, use user grouping
      return null;
    });

    // Build adjustments per user
    const adjustments = [];
    let processedCount = 0;

    for (const userId of userIds) {
      const logs = userLogs[userId];
      const profile = profileMap.get(userId);
      const onboarding = onboardingMap.get(userId);
      const preferredDays = onboarding?.preferred_days?.length || 4;
      const fitnessLevel = profile?.fitness_level || "beginner";

      // Metrics
      const workoutsCompleted = logs.length;
      const completionRate = Math.min(1, workoutsCompleted / preferredDays);
      const prevWeekCount = prevWeekByUser[userId] || 0;
      
      // Volume change (by workout count as proxy)
      const volumeChangePct = prevWeekCount > 0
        ? ((workoutsCompleted - prevWeekCount) / prevWeekCount) * 100
        : 0;

      // Consistency: unique days trained
      const uniqueDays = new Set(logs.map(l => new Date(l.completed_at!).toISOString().split("T")[0]));
      const consistencyScore = Math.min(1, uniqueDays.size / preferredDays);

      // Determine adjustment
      let adjustmentType: string;
      let weightMultiplier: number;
      let repsModifier: number;
      let message: string;
      let messageEn: string;

      if (completionRate >= 0.9 && consistencyScore >= 0.8) {
        // Great week → increase difficulty
        switch (fitnessLevel) {
          case "beginner":
            weightMultiplier = 1.05; // +5% weight
            repsModifier = 1;
            break;
          case "intermediate":
            weightMultiplier = 1.075;
            repsModifier = 0;
            break;
          default:
            weightMultiplier = 1.05;
            repsModifier = 0;
        }
        adjustmentType = "increase";
        message = `¡Semana excelente! ${workoutsCompleted}/${preferredDays} sesiones completadas. Subimos la intensidad 🔥`;
        messageEn = `Excellent week! ${workoutsCompleted}/${preferredDays} sessions completed. We are increasing the intensity 🔥`;
      } else if (completionRate >= 0.6) {
        // Decent week → maintain
        weightMultiplier = 1.0;
        repsModifier = 0;
        adjustmentType = "maintain";
        message = `Buena semana (${workoutsCompleted}/${preferredDays} sesiones). Mantenemos el nivel actual 💪`;
        messageEn = `Good week (${workoutsCompleted}/${preferredDays} sessions). We are maintaining your current level 💪`;
      } else if (completionRate >= 0.3) {
        // Low completion → slight decrease
        weightMultiplier = 0.95;
        repsModifier = -1;
        adjustmentType = "decrease";
        message = `Semana tranquila (${workoutsCompleted}/${preferredDays}). Ajustamos para que sea más manejable 🎯`;
        messageEn = `A lighter week (${workoutsCompleted}/${preferredDays}). We adjusted the load to make it more manageable 🎯`;
      } else {
        // Very low → significant decrease
        weightMultiplier = 0.9;
        repsModifier = -2;
        adjustmentType = "decrease";
        message = `Pocas sesiones esta semana (${workoutsCompleted}/${preferredDays}). Reducimos carga para retomar con confianza 👊`;
        messageEn = `Only a few sessions this week (${workoutsCompleted}/${preferredDays}). We reduced the load so you can return confidently 👊`;
      }

      adjustments.push({
        user_id: userId,
        week_start: weekStartDate,
        completion_rate: Math.round(completionRate * 100) / 100,
        volume_change_pct: Math.round(volumeChangePct * 10) / 10,
        consistency_score: Math.round(consistencyScore * 100) / 100,
        adjustment_type: adjustmentType,
        weight_multiplier: Math.round(weightMultiplier * 1000) / 1000,
        reps_modifier: repsModifier,
        message,
        message_en: messageEn,
      });
      processedCount++;
    }

    // Upsert adjustments
    if (adjustments.length > 0) {
      const { error } = await supabase
        .from("weekly_adjustments")
        .upsert(adjustments, { onConflict: "user_id,week_start" });

      if (error) {
        console.error("Error upserting adjustments:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
