import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { exercise_id } = await req.json();
    if (!exercise_id) {
      return new Response(JSON.stringify({ error: "exercise_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if image already exists
    const { data: exercise } = await supabase
      .from("exercises")
      .select("id, name, muscle_group, image_url, gym_id")
      .eq("id", exercise_id)
      .single();

    if (!exercise) {
      return new Response(JSON.stringify({ error: "Exercise not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: only super-admin or gym-admin of the exercise's gym can (re)generate
    const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    let allowed = isSuper === true;
    if (!allowed && exercise.gym_id) {
      const { data: isGymAdmin } = await supabase.rpc("is_gym_admin", {
        _user_id: user.id,
        _gym_id: exercise.gym_id,
      });
      allowed = isGymAdmin === true;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (exercise.image_url) {
      return new Response(JSON.stringify({ image_url: exercise.image_url }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image via AI
    const prompt = `Generate a clean, simple illustration of a person performing the exercise "${exercise.name}" (muscle group: ${exercise.muscle_group}). Show proper form with clear body positioning. Minimalist fitness illustration style, dark background with neon green/cyan accent lines, athletic figure silhouette. No text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const filePath = `exercise-images/${exercise.id}.png`;

    // Ensure bucket exists
    await supabase.storage.createBucket("exercise-images", { public: true }).catch(() => {});

    const { error: uploadErr } = await supabase.storage
      .from("exercise-images")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      // Return base64 as fallback
      return new Response(JSON.stringify({ image_url: imageData }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("exercise-images").getPublicUrl(filePath);
    const finalUrl = publicUrl.publicUrl;

    // Save URL to exercise
    await supabase.from("exercises").update({ image_url: finalUrl }).eq("id", exercise.id);

    return new Response(JSON.stringify({ image_url: finalUrl }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
