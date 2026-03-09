
-- Add default_weight column to workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS default_weight numeric DEFAULT 0;

-- Push Day (beginner)
UPDATE workout_exercises SET default_weight = 40 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 14 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 25 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 6 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 15 WHERE workout_id = 'a0000001-0000-0000-0000-000000000001' AND sort_order = 6;

-- Pull Day (beginner)
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 35 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 20 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 8 WHERE workout_id = 'a0000001-0000-0000-0000-000000000002' AND sort_order = 6;

-- Leg Day (beginner)
UPDATE workout_exercises SET default_weight = 40 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 80 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 25 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 20 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000001-0000-0000-0000-000000000003' AND sort_order = 6;

-- Upper Body Avanzado (advanced)
UPDATE workout_exercises SET default_weight = 80 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 15 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 60 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 6;
UPDATE workout_exercises SET default_weight = 35 WHERE workout_id = 'a0000001-0000-0000-0000-000000000004' AND sort_order = 7;

-- Full Body Express (intermediate)
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000001-0000-0000-0000-000000000005' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000001-0000-0000-0000-000000000005' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 40 WHERE workout_id = 'a0000001-0000-0000-0000-000000000005' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 16 WHERE workout_id = 'a0000001-0000-0000-0000-000000000005' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000005' AND sort_order = 5;

-- Core & Estabilidad (beginner)
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000006' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000006' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000006' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000001-0000-0000-0000-000000000006' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000001-0000-0000-0000-000000000006' AND sort_order = 5;

-- Quema Grasa HIIT (intermediate)
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000002-0000-0000-0000-000000000001' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000001' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000002-0000-0000-0000-000000000001' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 25 WHERE workout_id = 'a0000002-0000-0000-0000-000000000001' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000001' AND sort_order = 5;

-- Cardio + Core Fat Burn (beginner)
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000002' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000002' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 12 WHERE workout_id = 'a0000002-0000-0000-0000-000000000002' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000002' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000002' AND sort_order = 5;

-- Hipertrofia Pecho y Espalda (intermediate)
UPDATE workout_exercises SET default_weight = 60 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 20 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 12 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 45 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 22 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 35 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 6;
UPDATE workout_exercises SET default_weight = 18 WHERE workout_id = 'a0000002-0000-0000-0000-000000000003' AND sort_order = 7;

-- Hipertrofia Piernas y Glúteos (intermediate)
UPDATE workout_exercises SET default_weight = 60 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 16 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 30 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 35 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 40 WHERE workout_id = 'a0000002-0000-0000-0000-000000000004' AND sort_order = 6;

-- Hipertrofia Brazos y Hombros (intermediate)
UPDATE workout_exercises SET default_weight = 18 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 8 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 15 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 25 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 5;
UPDATE workout_exercises SET default_weight = 25 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 6;
UPDATE workout_exercises SET default_weight = 18 WHERE workout_id = 'a0000002-0000-0000-0000-000000000005' AND sort_order = 7;

-- Fuerza 5x5 Tren Superior (advanced)
UPDATE workout_exercises SET default_weight = 80 WHERE workout_id = 'a0000002-0000-0000-0000-000000000006' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 70 WHERE workout_id = 'a0000002-0000-0000-0000-000000000006' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 50 WHERE workout_id = 'a0000002-0000-0000-0000-000000000006' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 15 WHERE workout_id = 'a0000002-0000-0000-0000-000000000006' AND sort_order = 4;

-- Fuerza 5x5 Tren Inferior (advanced)
UPDATE workout_exercises SET default_weight = 90 WHERE workout_id = 'a0000002-0000-0000-0000-000000000007' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 100 WHERE workout_id = 'a0000002-0000-0000-0000-000000000007' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 70 WHERE workout_id = 'a0000002-0000-0000-0000-000000000007' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 60 WHERE workout_id = 'a0000002-0000-0000-0000-000000000007' AND sort_order = 4;

-- Powerlifting Basics (advanced)
UPDATE workout_exercises SET default_weight = 100 WHERE workout_id = 'a0000002-0000-0000-0000-000000000008' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 90 WHERE workout_id = 'a0000002-0000-0000-0000-000000000008' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 110 WHERE workout_id = 'a0000002-0000-0000-0000-000000000008' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000008' AND sort_order = 4;

-- Movilidad y Flexibilidad (beginner)
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000009' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000009' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 8 WHERE workout_id = 'a0000002-0000-0000-0000-000000000009' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000009' AND sort_order = 4;

-- Movilidad + Core Activo (beginner)
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000010' AND sort_order = 1;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000010' AND sort_order = 2;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000010' AND sort_order = 3;
UPDATE workout_exercises SET default_weight = 10 WHERE workout_id = 'a0000002-0000-0000-0000-000000000010' AND sort_order = 4;
UPDATE workout_exercises SET default_weight = 0 WHERE workout_id = 'a0000002-0000-0000-0000-000000000010' AND sort_order = 5;
