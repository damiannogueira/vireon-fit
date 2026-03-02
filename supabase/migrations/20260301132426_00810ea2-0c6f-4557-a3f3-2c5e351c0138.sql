
-- Link gym_admin user to the gym
UPDATE public.user_roles 
SET gym_id = '3e89d237-8ce1-4d0b-bbc0-9474a7e78d14' 
WHERE user_id = 'a8d5ef63-2556-41c0-9724-32bc37740f8e' AND role = 'gym_admin';

-- Also link their profile
UPDATE public.profiles 
SET gym_id = '3e89d237-8ce1-4d0b-bbc0-9474a7e78d14' 
WHERE user_id = 'a8d5ef63-2556-41c0-9724-32bc37740f8e';

-- Set gym owner
UPDATE public.gyms 
SET owner_id = 'a8d5ef63-2556-41c0-9724-32bc37740f8e' 
WHERE id = '3e89d237-8ce1-4d0b-bbc0-9474a7e78d14';

-- Seed global exercises
INSERT INTO public.exercises (name, muscle_group, is_global, description) VALUES
  ('Press Banca', 'chest', true, 'Bench press con barra'),
  ('Press Inclinado Mancuernas', 'chest', true, 'Incline dumbbell press'),
  ('Aperturas Cable', 'chest', true, 'Cable fly'),
  ('Press Militar', 'shoulders', true, 'Overhead barbell press'),
  ('Elevaciones Laterales', 'shoulders', true, 'Lateral raises with dumbbells'),
  ('Press Arnold', 'shoulders', true, 'Arnold press'),
  ('Fondos en Paralelas', 'triceps', true, 'Dips'),
  ('Extensión Tríceps Polea', 'triceps', true, 'Triceps pushdown'),
  ('Dominadas', 'back', true, 'Pull-ups'),
  ('Remo con Barra', 'back', true, 'Barbell row'),
  ('Jalón al Pecho', 'back', true, 'Lat pulldown'),
  ('Curl Bíceps Barra', 'biceps', true, 'Barbell biceps curl'),
  ('Curl Martillo', 'biceps', true, 'Hammer curl'),
  ('Sentadilla', 'legs', true, 'Barbell squat'),
  ('Prensa de Piernas', 'legs', true, 'Leg press'),
  ('Peso Muerto Rumano', 'legs', true, 'Romanian deadlift'),
  ('Extensión de Cuádriceps', 'legs', true, 'Leg extension'),
  ('Curl Femoral', 'legs', true, 'Leg curl'),
  ('Plancha', 'core', true, 'Plank'),
  ('Crunch Polea', 'core', true, 'Cable crunch');
