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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("gender, height_cm, weight_kg, fitness_level, birth_date")
      .eq("user_id", user.id)
      .single();

    // Get onboarding data
    const { data: onboarding } = await supabaseAuth
      .from("onboarding_progress")
      .select("fitness_goal, preferred_days")
      .eq("user_id", user.id)
      .single();

    if (!profile || !onboarding) {
      return new Response(JSON.stringify({ error: "Profile or onboarding not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get available exercises from DB
    const { data: exercises } = await supabaseAuth
      .from("exercises")
      .select("id, name, muscle_group, description")
      .eq("is_global", true);

    // Calculate age
    let age = 30; // default
    if (profile.birth_date) {
      const bd = new Date(profile.birth_date);
      const today = new Date();
      age = today.getFullYear() - bd.getFullYear();
      if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) {
        age--;
      }
    }

    // Calculate BMI for context
    const heightM = (profile.height_cm || 170) / 100;
    const bmi = (profile.weight_kg || 70) / (heightM * heightM);
    
    const daysPerWeek = onboarding.preferred_days?.length || 4;
    const goal = onboarding.fitness_goal || "general";
    const level = profile.fitness_level || "beginner";
    const gender = profile.gender || "other";

    const exerciseList = (exercises || []).map(e => `${e.name} (${e.muscle_group})`).join(", ");

    const systemPrompt = `Eres un entrenador personal certificado con 15 años de experiencia. Generas rutinas de entrenamiento personalizadas en formato JSON. 

REGLAS CRÍTICAS:
- Adapta TODO al perfil del usuario (edad, sexo, peso, nivel, IMC)
- Personas con sobrepeso (IMC > 30): menor impacto, progresión gradual, más cardio moderado
- Personas mayores de 50: foco en movilidad, cuidado articular, menos peso más repeticiones
- Mujeres: incluir más ejercicios de glúteos, core, y tren inferior. Menos énfasis en tren superior pesado a menos que sea el objetivo
- Principiantes: menos volumen, más descanso, pesos bajos, instrucciones claras
- Avanzados: mayor volumen, super-series, técnicas avanzadas
- SIEMPRE incluir entrada en calor (warmup) como primer bloque de cada día
- La entrada en calor debe ser específica al grupo muscular del día
- Cada ejercicio DEBE tener una explicación clara para principiantes

RESPONDE SOLO con JSON válido, sin markdown ni texto adicional.`;

    const userPrompt = `Genera un plan de entrenamiento personalizado con estas características:

PERFIL DEL USUARIO:
- Sexo: ${gender === "male" ? "Hombre" : gender === "female" ? "Mujer" : "No especificado"}
- Edad: ${age} años
- Peso: ${profile.weight_kg || 70} kg
- Altura: ${profile.height_cm || 170} cm
- IMC: ${bmi.toFixed(1)}
- Nivel: ${level === "beginner" ? "Principiante" : level === "intermediate" ? "Intermedio" : "Avanzado"}
- Objetivo: ${goal === "hipertrofia" ? "Ganar masa muscular" : goal === "fuerza" ? "Aumentar fuerza" : goal === "perdida_grasa" ? "Perder grasa corporal" : "Mantenimiento general"}
- Días por semana: ${daysPerWeek}

EJERCICIOS DISPONIBLES EN LA BASE DE DATOS (usa EXACTAMENTE estos nombres):
${exerciseList}

FORMATO DE RESPUESTA (JSON):
{
  "plan_name": "nombre descriptivo del plan",
  "plan_description": "descripción breve del plan adaptado al usuario",
  "days": [
    {
      "day_number": 1,
      "name": "nombre del día (ej: Tren Superior - Push)",
      "description": "descripción breve",
      "warmup": {
        "duration_minutes": 8,
        "exercises": [
          {
            "name": "nombre del ejercicio de calentamiento",
            "duration_or_reps": "30 segundos o 10 reps",
            "description": "explicación clara y simple"
          }
        ]
      },
      "exercises": [
        {
          "exercise_name": "nombre EXACTO del ejercicio de la lista",
          "sets": 3,
          "reps": 12,
          "rest_seconds": 60,
          "weight_suggestion_kg": 20,
          "intensity": "moderada",
          "description": "explicación detallada de cómo hacer el ejercicio correctamente, con tips de forma y errores comunes a evitar",
          "notes": "nota adicional para este perfil específico"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Genera exactamente ${daysPerWeek} días
- Usa SOLO ejercicios de la lista proporcionada
- Adapta pesos sugeridos al perfil (edad, peso, nivel, sexo)
- La entrada en calor debe incluir 4-6 ejercicios de movilidad y activación
- Cada ejercicio principal necesita descripción clara para alguien sin experiencia
- Si el usuario tiene sobrepeso, reduce impacto y sugiere pesos conservadores
- Si el usuario es mayor de 50, prioriza movilidad y rangos de movimiento controlados`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_training_plan",
              description: "Create a personalized training plan",
              parameters: {
                type: "object",
                properties: {
                  plan_name: { type: "string" },
                  plan_description: { type: "string" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        name: { type: "string" },
                        description: { type: "string" },
                        warmup: {
                          type: "object",
                          properties: {
                            duration_minutes: { type: "number" },
                            exercises: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  duration_or_reps: { type: "string" },
                                  description: { type: "string" },
                                },
                                required: ["name", "duration_or_reps", "description"],
                              },
                            },
                          },
                          required: ["duration_minutes", "exercises"],
                        },
                        exercises: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              exercise_name: { type: "string" },
                              sets: { type: "number" },
                              reps: { type: "number" },
                              rest_seconds: { type: "number" },
                              weight_suggestion_kg: { type: "number" },
                              intensity: { type: "string" },
                              description: { type: "string" },
                              notes: { type: "string" },
                            },
                            required: ["exercise_name", "sets", "reps", "rest_seconds", "description"],
                          },
                        },
                      },
                      required: ["day_number", "name", "warmup", "exercises"],
                    },
                  },
                },
                required: ["plan_name", "plan_description", "days"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_training_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI service rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let plan;
    if (toolCall?.function?.arguments) {
      plan = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Now save the plan to the database
    const exerciseMap = new Map((exercises || []).map(e => [e.name.toLowerCase(), e.id]));
    const savedWorkouts: string[] = [];

    // Delete previous AI-generated workouts for this user
    const { data: existingWorkouts } = await supabaseAuth
      .from("workouts")
      .select("id")
      .eq("created_by", user.id)
      .eq("is_global", false);

    if (existingWorkouts && existingWorkouts.length > 0) {
      const ids = existingWorkouts.map(w => w.id);
      // Delete exercise links first
      await supabaseAuth.from("workout_exercises").delete().in("workout_id", ids);
      // Delete workout logs for these workouts
      await supabaseAuth.from("workout_logs").delete().eq("user_id", user.id).in("workout_id", ids);
      // Delete workouts
      await supabaseAuth.from("workouts").delete().in("id", ids);
    }

    for (const day of plan.days || []) {
      // Create workout
      const { data: workout, error: wError } = await supabaseAuth
        .from("workouts")
        .insert({
          name: day.name,
          description: day.description || plan.plan_description,
          estimated_duration: 45 + (day.exercises?.length || 0) * 5,
          difficulty: level as any,
          goal_type: goal,
          target_gender: gender === "other" ? "unisex" : gender,
          is_global: false,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (wError || !workout) {
        console.error("Error creating workout:", wError);
        continue;
      }

      savedWorkouts.push(workout.id);

      // Save exercises
      const exerciseInserts = (day.exercises || []).map((ex: any, idx: number) => {
        // Find exercise ID by matching name
        const exId = findExerciseId(exerciseMap, ex.exercise_name);
        return {
          workout_id: workout.id,
          exercise_id: exId || (exercises && exercises.length > 0 ? exercises[0].id : null),
          sets: ex.sets || 3,
          reps: ex.reps || 10,
          rest_seconds: ex.rest_seconds || 60,
          default_weight: ex.weight_suggestion_kg || 0,
          sort_order: idx + 1,
        };
      }).filter((e: any) => e.exercise_id);

      if (exerciseInserts.length > 0) {
        await supabaseAuth.from("workout_exercises").insert(exerciseInserts);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan_name: plan.plan_name,
        plan_description: plan.plan_description,
        workout_ids: savedWorkouts,
        days: plan.days,
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

function findExerciseId(map: Map<string, string>, name: string): string | undefined {
  // Exact match
  const exact = map.get(name.toLowerCase());
  if (exact) return exact;
  
  // Partial match
  for (const [key, id] of map.entries()) {
    if (key.includes(name.toLowerCase()) || name.toLowerCase().includes(key)) {
      return id;
    }
  }
  return undefined;
}
