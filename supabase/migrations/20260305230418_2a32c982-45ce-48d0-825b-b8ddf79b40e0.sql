
-- Seed global achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value, xp_reward, is_global) VALUES
  ('Primera Racha', 'Entrená 3 días seguidos', '🔥', 'streak_days', 3, 50, true),
  ('10 Workouts', 'Completá 10 entrenamientos', '🎯', 'workout_count', 10, 100, true),
  ('25 Workouts', 'Completá 25 entrenamientos', '💪', 'workout_count', 25, 150, true),
  ('50 Workouts', 'Completá 50 entrenamientos', '⭐', 'workout_count', 50, 250, true),
  ('100 Workouts', 'Completá 100 entrenamientos', '🏆', 'workout_count', 100, 500, true),
  ('Nivel 5', 'Alcanzá el nivel 5', '⭐', 'level', 5, 100, true),
  ('Nivel 10', 'Alcanzá el nivel 10', '⚡', 'level', 10, 200, true),
  ('Nivel 20', 'Alcanzá el nivel 20', '🏆', 'level', 20, 500, true),
  ('Racha de 7', 'Entrená 7 días seguidos', '🔥', 'streak_days', 7, 100, true),
  ('Racha de 30', 'Entrená 30 días seguidos', '🏆', 'streak_days', 30, 500, true),
  ('1000 XP', 'Acumulá 1000 XP', '📈', 'xp_total', 1000, 50, true),
  ('5000 XP', 'Acumulá 5000 XP', '📈', 'xp_total', 5000, 150, true),
  ('Primer Entreno', 'Completá tu primer workout', '🎯', 'workout_count', 1, 25, true),
  ('Madrugador', 'Completá 5 entrenamientos', '⏰', 'workout_count', 5, 50, true);
