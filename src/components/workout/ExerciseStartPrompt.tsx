import { motion } from "framer-motion";
import { Play, Flame, Info, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const MOTIVATIONAL_MESSAGES = [
  "¡Es tu momento! 🔥",
  "¡Dale con todo! 💪",
  "¡Sin excusas! ⚡",
  "¡Vos podés! 🚀",
  "¡A romperla! 🏆",
  "¡Cada rep cuenta! 💥",
];

interface ExerciseStartPromptProps {
  exerciseName: string;
  exerciseNumber: number;
  totalExercises: number;
  description?: string;
  muscleGroup?: string;
  imageUrl?: string;
  exerciseId?: string;
  onStart: () => void;
}

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  legs: "Piernas",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const ExerciseStartPrompt = ({
  exerciseName,
  exerciseNumber,
  totalExercises,
  description,
  muscleGroup,
  imageUrl,
  exerciseId,
  onStart,
}: ExerciseStartPromptProps) => {
  const message = MOTIVATIONAL_MESSAGES[(exerciseNumber - 1) % MOTIVATIONAL_MESSAGES.length];
  const [showDesc, setShowDesc] = useState(!!description);
  const [imgSrc, setImgSrc] = useState<string | null>(imageUrl || null);
  const [loadingImg, setLoadingImg] = useState(false);

  // Try to load image on demand if not present
  useEffect(() => {
    if (imgSrc || !exerciseId || loadingImg) return;
    
    const loadImage = async () => {
      setLoadingImg(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exercise-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ exercise_id: exerciseId }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.image_url) setImgSrc(data.image_url);
        }
      } catch (e) {
        console.error("Image load error:", e);
      } finally {
        setLoadingImg(false);
      }
    };

    loadImage();
  }, [exerciseId, imgSrc, loadingImg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-6 px-6 text-center gap-3"
    >
      {/* Exercise Image */}
      {imgSrc ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-40 h-40 rounded-2xl overflow-hidden bg-card border border-border/50"
        >
          <img src={imgSrc} alt={exerciseName} className="w-full h-full object-cover" />
        </motion.div>
      ) : loadingImg ? (
        <div className="w-40 h-40 rounded-2xl bg-card border border-border/50 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Flame className="w-8 h-8 text-primary" />
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Ejercicio {exerciseNumber} de {totalExercises}
        </p>
        <h3 className="text-2xl font-display font-bold text-foreground">
          {exerciseName}
        </h3>
        {muscleGroup && (
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {MUSCLE_GROUP_LABELS[muscleGroup] || muscleGroup}
          </span>
        )}
      </div>

      {/* Exercise Description */}
      {description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: showDesc ? 1 : 0, height: showDesc ? "auto" : 0 }}
          className="w-full"
        >
          <div className="p-4 rounded-2xl bg-card border border-border/50 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Cómo hacerlo
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </motion.div>
      )}

      {!description && (
        <p className="text-lg font-semibold text-primary">{message}</p>
      )}

      {description && (
        <p className="text-base font-semibold text-primary">{message}</p>
      )}

      <button
        onClick={onStart}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-[0_0_24px_hsl(var(--primary)/0.3)] transition-all active:scale-[0.97] hover:shadow-[0_0_32px_hsl(var(--primary)/0.4)]"
      >
        <Play className="w-5 h-5" />
        Comenzar
      </button>
    </motion.div>
  );
};
