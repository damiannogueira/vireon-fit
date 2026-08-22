// Translates Spanish content stored in the database (achievements, workout /
// exercise names) into the active UI locale. DB rows are seeded/generated in
// Spanish, so English users would otherwise see mixed-language labels.

const EXACT_EN: Record<string, string> = {
  // Achievements
  "Primer Entreno": "First Workout",
  "Primera Racha": "First Streak",
  "Racha de 7": "7 Day Streak",
  "Racha de 30": "30 Day Streak",
  "Madrugador": "Early Bird",
  "Nivel 5": "Level 5",
  "Nivel 10": "Level 10",
  "Nivel 20": "Level 20",
  // Achievement descriptions
  "Completá tu primer workout": "Complete your first workout",
  "Completá 5 entrenamientos": "Complete 5 workouts",
  "Completá 10 entrenamientos": "Complete 10 workouts",
  "Completá 25 entrenamientos": "Complete 25 workouts",
  "Completá 50 entrenamientos": "Complete 50 workouts",
  "Completá 100 entrenamientos": "Complete 100 workouts",
  "Acumulá 1000 XP": "Earn 1000 XP",
  "Acumulá 5000 XP": "Earn 5000 XP",
  "Entrená 3 días seguidos": "Train 3 days in a row",
  "Entrená 7 días seguidos": "Train 7 days in a row",
  "Entrená 30 días seguidos": "Train 30 days in a row",
  "Alcanzá el nivel 5": "Reach level 5",
  "Alcanzá el nivel 10": "Reach level 10",
  "Alcanzá el nivel 20": "Reach level 20",
  "Primera vez con este ejercicio": "First time doing this exercise",
  "Sin datos previos suficientes": "Not enough previous data",
  "Mantené las reps, buen trabajo": "Keep the same reps, good work",
  "Repetí la sesión anterior, vas bien 👊": "Repeat your previous session, you're doing well 👊",
  "Mismo peso, +1 rep por serie ⬆️": "Same weight, +1 rep per set ⬆️",
  "Mantené peso y reps, consolidá 💪": "Keep the same weight and reps to consolidate 💪",
};

const translateStructuredText = (text: string): string | null => {
  let match = text.match(/^¡Semana excelente! (\d+)\/(\d+) sesiones completadas\. Subimos la intensidad 🔥$/i);
  if (match) return `Excellent week! ${match[1]}/${match[2]} sessions completed. We're increasing the intensity 🔥`;
  match = text.match(/^Buena semana \((\d+)\/(\d+) sesiones\)\. Mantenemos el nivel actual 💪$/i);
  if (match) return `Good week (${match[1]}/${match[2]} sessions). We're maintaining your current level 💪`;
  match = text.match(/^Semana tranquila \((\d+)\/(\d+)\)\. Ajustamos para que sea más manejable 🎯$/i);
  if (match) return `A lighter week (${match[1]}/${match[2]}). We're adjusting the load to make it more manageable 🎯`;
  match = text.match(/^Pocas sesiones esta semana \((\d+)\/(\d+)\)\. Reducimos carga para retomar con confianza 👊$/i);
  if (match) return `Only a few sessions this week (${match[1]}/${match[2]}). We're reducing the load so you can return confidently 👊`;

  match = text.match(/^Este plan de (?:Workout|entrenamiento) de (\d+) (?:Days|días) por semana está diseñado para (?:un hombre|una mujer|una persona) (principiante|intermedio|avanzado) de (\d+) años con un IMC (normal|alto|bajo) que busca (.+?)\. Se enfoca en ejercicios multiarticulares (?:with|con) un volumen adecuado para una progresión segura (?:and|y) efectiva\.$/i);
  if (match) {
    const levels: Record<string, string> = { principiante: "beginner", intermedio: "intermediate", avanzado: "advanced" };
    return `This ${match[1]}-day-per-week workout plan is designed for a ${match[3]}-year-old ${levels[match[2].toLowerCase()] || match[2]} with a ${match[4]} BMI whose goal is ${translateDbLabel(match[5], "en").toLowerCase()}. It focuses on compound exercises with appropriate volume for safe, effective progression.`;
  }
  return null;
};

// Ordered longest-first so multi-word terms win over single words.
const TERMS_EN: [RegExp, string][] = (
  [
    ["Tren Inferior", "Lower Body"],
    ["Tren Superior", "Upper Body"],
    ["Cuerpo Completo", "Full Body"],
    ["Cuerpo Entero", "Full Body"],
    ["Entrenamiento", "Workout"],
    ["Abdominales", "Abs"],
    ["Movilidad", "Mobility"],
    ["Resistencia", "Endurance"],
    ["Estiramiento", "Stretching"],
    ["Calentamiento", "Warm-up"],
    ["Gemelos", "Calves"],
    ["Glúteos", "Glutes"],
    ["Hombros", "Shoulders"],
    ["Espalda", "Back"],
    ["Piernas", "Legs"],
    ["Bíceps", "Biceps"],
    ["Tríceps", "Triceps"],
    ["Antebrazo", "Forearm"],
    ["Descanso", "Rest"],
    ["Fuerza", "Strength"],
    ["Empuje", "Push"],
    ["Tirón", "Pull"],
    ["Brazos", "Arms"],
    ["Pecho", "Chest"],
    ["Cardio", "Cardio"],
    ["Torso", "Torso"],
    ["Día", "Day"],
    ["Potencia", "Power"],
    ["Completo", "Full"],
    ["Integrado", "Integrated"],
    ["Jalones", "Pulldowns"],
    ["Ganar masa muscular", "building muscle"],
    ["Aumentar fuerza", "increasing strength"],
    ["aumentar su fuerza", "increase strength"],
    ["Perder grasa corporal", "losing body fat"],
    ["perder grasa corporal", "lose body fat"],
    ["Mantenimiento general", "general fitness"],
  ] as [string, string][]
).map(([es, en]) => [new RegExp(es, "gi"), en] as [RegExp, string]);

const CONNECTORS: [RegExp, string][] = [
  [/\sy\s/g, " and "],
  [/\sde\s/g, " of "],
  [/\sdel\s/g, " of the "],
  [/\scon\s/g, " with "],
];

export function translateDbLabel(text: string | null | undefined, locale: string): string {
  if (!text) return text ?? "";
  if (locale !== "en") return text;
  if (EXACT_EN[text]) return EXACT_EN[text];
  const structured = translateStructuredText(text);
  if (structured) return structured;

  let out = text;
  for (const [re, en] of TERMS_EN) out = out.replace(re, en);
  for (const [re, en] of CONNECTORS) out = out.replace(re, en);
  return out;
}

type LocalizedRecord = {
  name?: string | null;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  message?: string | null;
  message_en?: string | null;
};

export function localizedField(
  record: LocalizedRecord | null | undefined,
  field: "name" | "description" | "message",
  locale: string,
): string {
  if (!record) return "";
  const englishKey = `${field}_en` as "name_en" | "description_en" | "message_en";
  if (locale === "en" && record[englishKey]) return record[englishKey] || "";
  return translateDbLabel(record[field], locale);
}
