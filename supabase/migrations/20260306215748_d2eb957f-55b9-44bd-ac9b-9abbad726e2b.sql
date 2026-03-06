
-- Insert 6 global workouts
INSERT INTO workouts (id, name, description, estimated_duration, difficulty, is_global) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Push Day - Pecho y Tríceps', 'Rutina de empuje enfocada en pecho, hombros y tríceps', 50, 'beginner', true),
  ('a0000001-0000-0000-0000-000000000002', 'Pull Day - Espalda y Bíceps', 'Rutina de tirón enfocada en espalda y bíceps', 50, 'beginner', true),
  ('a0000001-0000-0000-0000-000000000003', 'Leg Day - Piernas Completo', 'Rutina completa de tren inferior', 55, 'beginner', true),
  ('a0000001-0000-0000-0000-000000000004', 'Upper Body Avanzado', 'Entrenamiento intenso de tren superior para avanzados', 60, 'advanced', true),
  ('a0000001-0000-0000-0000-000000000005', 'Full Body Express', 'Rutina full body para sesiones cortas', 35, 'intermediate', true),
  ('a0000001-0000-0000-0000-000000000006', 'Core & Estabilidad', 'Trabajo de abdominales y estabilización', 30, 'beginner', true);

-- Push Day exercises
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', '602f2b1a-7ea1-4f41-b696-effebc403d21', 4, 10, 120, 1),  -- Press Banca
  ('a0000001-0000-0000-0000-000000000001', '9b731b0c-7ecf-4f43-978c-ec2500e8140f', 3, 12, 90, 2),   -- Press Inclinado Mancuernas
  ('a0000001-0000-0000-0000-000000000001', 'a708a48e-8c7c-48a4-85c7-014fccafd3fe', 3, 15, 60, 3),   -- Aperturas Cable
  ('a0000001-0000-0000-0000-000000000001', '966cb6ea-28df-40a9-acd8-a386300ff019', 3, 10, 90, 4),   -- Press Militar Barra
  ('a0000001-0000-0000-0000-000000000001', '696775dd-24fe-4c95-a466-25063dc55059', 3, 15, 60, 5),   -- Elevaciones Laterales
  ('a0000001-0000-0000-0000-000000000001', '1be9a649-712f-468d-b64a-55fd8922cc6e', 3, 12, 60, 6);   -- Extensión Tríceps Polea Cuerda

-- Pull Day exercises
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000002', '44a4b703-4ef7-4561-8f7e-602d108a3558', 4, 8, 120, 1),   -- Peso Muerto Convencional
  ('a0000001-0000-0000-0000-000000000002', '786b1ffc-1b39-4de2-a1d7-c88e20f9e7dd', 3, 8, 90, 2),    -- Dominadas
  ('a0000001-0000-0000-0000-000000000002', 'a1fe3310-0248-4dde-a3e1-598fd9cf9885', 3, 10, 90, 3),   -- Remo con Barra
  ('a0000001-0000-0000-0000-000000000002', '269c9924-2ded-4ce9-8c3f-10ec4ce1f252', 3, 12, 60, 4),   -- Jalón al Pecho
  ('a0000001-0000-0000-0000-000000000002', '97d9849f-1e8a-4ebc-b918-3796d2258f4c', 3, 10, 60, 5),   -- Curl Barra Z
  ('a0000001-0000-0000-0000-000000000002', '0ffdba67-8d14-4321-a9c1-9026b34ff5fa', 3, 12, 60, 6);   -- Curl Martillo

-- Leg Day exercises
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000003', '7e73d1c2-e486-4a3d-ac18-51b505c694a6', 4, 10, 120, 1),  -- Sentadilla con Barra
  ('a0000001-0000-0000-0000-000000000003', 'fa0eb128-ec33-4daa-b905-103bc0ae2884', 3, 12, 90, 2),   -- Prensa de Piernas
  ('a0000001-0000-0000-0000-000000000003', 'ddc7298f-b30c-4b09-9b21-2494d94408aa', 3, 10, 90, 3),   -- Peso Muerto Rumano
  ('a0000001-0000-0000-0000-000000000003', '6b796103-6d48-4ad7-8792-3eb535a5f84d', 3, 15, 60, 4),   -- Extensión Cuádriceps
  ('a0000001-0000-0000-0000-000000000003', 'ae0d338f-deb3-473d-9fff-a8e6783d440c', 3, 12, 60, 5),   -- Curl Femoral
  ('a0000001-0000-0000-0000-000000000003', '0ce172fb-4830-4056-b8e5-7168b92aed67', 4, 15, 60, 6);   -- Elevación Talones

-- Upper Body Avanzado
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000004', '30345b87-ad87-4db8-a428-f18b1883cb53', 5, 5, 180, 1),   -- Press Banca Plano Barra
  ('a0000001-0000-0000-0000-000000000004', '786b1ffc-1b39-4de2-a1d7-c88e20f9e7dd', 4, 8, 120, 2),   -- Dominadas
  ('a0000001-0000-0000-0000-000000000004', 'a1045c59-049e-4a07-baef-669a77638a0a', 4, 8, 120, 3),   -- Press Militar
  ('a0000001-0000-0000-0000-000000000004', 'd6a7eb0e-590b-409a-89e5-87e30065dd90', 4, 10, 90, 4),   -- Remo Mancuerna
  ('a0000001-0000-0000-0000-000000000004', '06286578-a560-422b-9f99-d31e72a03221', 3, 15, 60, 5),   -- Cruces Polea Alta
  ('a0000001-0000-0000-0000-000000000004', 'e2adf1bc-7d1e-4c55-8ff4-fb542377581c', 4, 8, 90, 6),    -- Press Cerrado Barra
  ('a0000001-0000-0000-0000-000000000004', '85ecc6ec-38d2-4585-b2f0-cefd7d6a3895', 3, 10, 60, 7);   -- Curl Barra Recta

-- Full Body Express
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000005', '9c57bf88-8d91-4cd6-b92f-f7e0272a17da', 3, 12, 90, 1),   -- Sentadilla
  ('a0000001-0000-0000-0000-000000000005', '602f2b1a-7ea1-4f41-b696-effebc403d21', 3, 10, 90, 2),   -- Press Banca
  ('a0000001-0000-0000-0000-000000000005', '198b5999-92b8-4eb4-a45c-5bb5d6c4acef', 3, 12, 60, 3),   -- Remo Polea Baja
  ('a0000001-0000-0000-0000-000000000005', '9b708d3c-a8a5-4fae-8b16-0a30c6d1a02d', 3, 10, 60, 4),   -- Press Militar Mancuernas
  ('a0000001-0000-0000-0000-000000000005', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 3, 20, 45, 5);   -- Crunch Abdominal

-- Core & Estabilidad
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 3, 20, 45, 1),   -- Crunch Abdominal
  ('a0000001-0000-0000-0000-000000000006', '7ebed9e3-eae4-4b08-8fdf-3a0156d6dbd2', 3, 12, 60, 2),   -- Elevación Piernas Colgado
  ('a0000001-0000-0000-0000-000000000006', 'e6e1ffb9-d314-4309-8e76-f9df54c5a5a4', 3, 10, 60, 3),   -- Ab Wheel Rollout
  ('a0000001-0000-0000-0000-000000000006', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 12, 45, 4),   -- Dead Bug
  ('a0000001-0000-0000-0000-000000000006', '3dda0a20-dcb9-406a-b788-b6deff75b105', 3, 12, 60, 5);   -- Leñador en Polea
