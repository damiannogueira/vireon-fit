
-- Rutinas orientadas a objetivos específicos
INSERT INTO workouts (id, name, description, estimated_duration, difficulty, is_global) VALUES
  ('a0000002-0000-0000-0000-000000000001', 'Quema Grasa HIIT', 'Circuito de alta intensidad para maximizar la quema calórica', 40, 'intermediate', true),
  ('a0000002-0000-0000-0000-000000000002', 'Cardio + Core Fat Burn', 'Combinación de cardio y abdominales para definición', 35, 'beginner', true),
  ('a0000002-0000-0000-0000-000000000003', 'Hipertrofia - Pecho y Espalda', 'Volumen alto para máximo crecimiento muscular en torso', 60, 'intermediate', true),
  ('a0000002-0000-0000-0000-000000000004', 'Hipertrofia - Piernas y Glúteos', 'Volumen e intensidad para desarrollo del tren inferior', 55, 'intermediate', true),
  ('a0000002-0000-0000-0000-000000000005', 'Hipertrofia - Brazos y Hombros', 'Sesión de alto volumen para brazos y deltoides', 50, 'intermediate', true),
  ('a0000002-0000-0000-0000-000000000006', 'Fuerza 5x5 - Tren Superior', 'Programa de fuerza clásico 5x5 para tren superior', 50, 'advanced', true),
  ('a0000002-0000-0000-0000-000000000007', 'Fuerza 5x5 - Tren Inferior', 'Programa de fuerza clásico 5x5 para piernas', 50, 'advanced', true),
  ('a0000002-0000-0000-0000-000000000008', 'Fuerza - Powerlifting Basics', 'Los 3 grandes: sentadilla, press banca y peso muerto', 60, 'advanced', true),
  ('a0000002-0000-0000-0000-000000000009', 'Movilidad y Flexibilidad', 'Trabajo de movilidad articular y estiramientos activos', 30, 'beginner', true),
  ('a0000002-0000-0000-0000-000000000010', 'Movilidad + Core Activo', 'Combinación de estabilización y movilidad funcional', 35, 'beginner', true);

-- Quema Grasa HIIT (circuito compuesto)
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000001', '9c57bf88-8d91-4cd6-b92f-f7e0272a17da', 4, 15, 45, 1),   -- Sentadilla
  ('a0000002-0000-0000-0000-000000000001', 'd0777bae-86cb-4cb1-9369-1853b1b1c1ce', 4, 15, 45, 2),   -- Flexiones
  ('a0000002-0000-0000-0000-000000000001', '5fa9f4e7-5e2a-4e9e-b42c-f8cd30d56f24', 4, 12, 45, 3),   -- Zancadas Mancuernas
  ('a0000002-0000-0000-0000-000000000001', 'a1fe3310-0248-4dde-a3e1-598fd9cf9885', 4, 12, 45, 4),   -- Remo con Barra
  ('a0000002-0000-0000-0000-000000000001', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 4, 20, 30, 5);   -- Crunch

-- Cardio + Core Fat Burn
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000002', 'c6708dcd-3639-4b73-92dd-87eb4b046ef6', 3, 15, 45, 1),   -- Step Ups
  ('a0000002-0000-0000-0000-000000000002', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 3, 25, 30, 2),   -- Crunch
  ('a0000002-0000-0000-0000-000000000002', 'b80c4f93-fda6-4867-8804-24594cf7cfd1', 3, 15, 45, 3),   -- Sentadilla Goblet
  ('a0000002-0000-0000-0000-000000000002', '7ebed9e3-eae4-4b08-8fdf-3a0156d6dbd2', 3, 12, 45, 4),   -- Elevación Piernas Colgado
  ('a0000002-0000-0000-0000-000000000002', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 15, 30, 5);   -- Dead Bug

-- Hipertrofia - Pecho y Espalda
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000003', '30345b87-ad87-4db8-a428-f18b1883cb53', 4, 10, 90, 1),   -- Press Banca Plano Barra
  ('a0000002-0000-0000-0000-000000000003', '9b731b0c-7ecf-4f43-978c-ec2500e8140f', 4, 12, 75, 2),   -- Press Inclinado Mancuernas
  ('a0000002-0000-0000-0000-000000000003', 'a708a48e-8c7c-48a4-85c7-014fccafd3fe', 3, 15, 60, 3),   -- Aperturas Cable
  ('a0000002-0000-0000-0000-000000000003', '269c9924-2ded-4ce9-8c3f-10ec4ce1f252', 4, 10, 90, 4),   -- Jalón al Pecho
  ('a0000002-0000-0000-0000-000000000003', 'd6a7eb0e-590b-409a-89e5-87e30065dd90', 4, 10, 75, 5),   -- Remo Mancuerna
  ('a0000002-0000-0000-0000-000000000003', '198b5999-92b8-4eb4-a45c-5bb5d6c4acef', 3, 12, 60, 6),   -- Remo Polea Baja
  ('a0000002-0000-0000-0000-000000000003', '9fdcfe00-207d-4c82-84ab-e0187c55c316', 3, 12, 60, 7);   -- Pull Over

-- Hipertrofia - Piernas y Glúteos
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000004', '7e73d1c2-e486-4a3d-ac18-51b505c694a6', 4, 10, 120, 1),  -- Sentadilla Barra
  ('a0000002-0000-0000-0000-000000000004', '2727294f-e061-4076-9187-b65b83c1a60d', 4, 12, 90, 2),   -- Hip Thrust
  ('a0000002-0000-0000-0000-000000000004', '17d64491-6cd2-4cb0-8d8b-a4b8aae7c8ec', 3, 10, 75, 3),   -- Sentadilla Búlgara
  ('a0000002-0000-0000-0000-000000000004', '8d23b376-f152-4ae6-bbac-5888d4a73984', 4, 12, 60, 4),   -- Curl Femoral Sentado
  ('a0000002-0000-0000-0000-000000000004', '6b796103-6d48-4ad7-8792-3eb535a5f84d', 3, 15, 60, 5),   -- Extensión Cuádriceps
  ('a0000002-0000-0000-0000-000000000004', '0ce172fb-4830-4056-b8e5-7168b92aed67', 4, 15, 45, 6);   -- Elevación Talones

-- Hipertrofia - Brazos y Hombros
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000005', '9b708d3c-a8a5-4fae-8b16-0a30c6d1a02d', 4, 10, 75, 1),   -- Press Militar Mancuernas
  ('a0000002-0000-0000-0000-000000000005', '87ee3d27-7fa7-4255-968c-cb64292ed40d', 4, 15, 60, 2),   -- Elevaciones Laterales Mancuernas
  ('a0000002-0000-0000-0000-000000000005', '708f7e78-f873-4726-97e6-5b115947d30c', 3, 15, 60, 3),   -- Face Pulls
  ('a0000002-0000-0000-0000-000000000005', '97d9849f-1e8a-4ebc-b918-3796d2258f4c', 4, 10, 60, 4),   -- Curl Barra Z
  ('a0000002-0000-0000-0000-000000000005', '59c729bd-52ec-494a-a2e5-f74f28647acb', 3, 12, 60, 5),   -- Curl Inclinado Mancuernas
  ('a0000002-0000-0000-0000-000000000005', '524aa6db-3364-4270-bb05-bbba95cc8a30', 4, 10, 60, 6),   -- Press Francés Barra Z
  ('a0000002-0000-0000-0000-000000000005', '1be9a649-712f-468d-b64a-55fd8922cc6e', 3, 15, 45, 7);   -- Extensión Tríceps Cuerda

-- Fuerza 5x5 - Tren Superior
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000006', '30345b87-ad87-4db8-a428-f18b1883cb53', 5, 5, 180, 1),   -- Press Banca Plano
  ('a0000002-0000-0000-0000-000000000006', '20b43a8b-0e38-43f0-86e3-64e8e74f1af8', 5, 5, 180, 2),   -- Remo con Barra
  ('a0000002-0000-0000-0000-000000000006', 'a1045c59-049e-4a07-baef-669a77638a0a', 5, 5, 180, 3),   -- Press Militar
  ('a0000002-0000-0000-0000-000000000006', '786b1ffc-1b39-4de2-a1d7-c88e20f9e7dd', 4, 6, 120, 4);   -- Dominadas

-- Fuerza 5x5 - Tren Inferior
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000007', '7e73d1c2-e486-4a3d-ac18-51b505c694a6', 5, 5, 180, 1),   -- Sentadilla Barra
  ('a0000002-0000-0000-0000-000000000007', '44a4b703-4ef7-4561-8f7e-602d108a3558', 5, 5, 180, 2),   -- Peso Muerto
  ('a0000002-0000-0000-0000-000000000007', '8b54b822-f083-4911-a151-536c90e5ae22', 4, 5, 150, 3),   -- Sentadilla Frontal
  ('a0000002-0000-0000-0000-000000000007', '2727294f-e061-4076-9187-b65b83c1a60d', 4, 8, 120, 4);   -- Hip Thrust

-- Fuerza - Powerlifting Basics
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000008', '7e73d1c2-e486-4a3d-ac18-51b505c694a6', 5, 3, 240, 1),   -- Sentadilla Barra
  ('a0000002-0000-0000-0000-000000000008', '30345b87-ad87-4db8-a428-f18b1883cb53', 5, 3, 240, 2),   -- Press Banca
  ('a0000002-0000-0000-0000-000000000008', '44a4b703-4ef7-4561-8f7e-602d108a3558', 5, 3, 240, 3),   -- Peso Muerto
  ('a0000002-0000-0000-0000-000000000008', '93b8f714-11f7-44f0-93ae-51a78c727a55', 3, 15, 60, 4);   -- Hiperextensiones

-- Movilidad y Flexibilidad
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000009', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 10, 30, 1),   -- Dead Bug
  ('a0000002-0000-0000-0000-000000000009', '93b8f714-11f7-44f0-93ae-51a78c727a55', 3, 12, 30, 2),   -- Hiperextensiones
  ('a0000002-0000-0000-0000-000000000009', 'b80c4f93-fda6-4867-8804-24594cf7cfd1', 3, 10, 30, 3),   -- Sentadilla Goblet
  ('a0000002-0000-0000-0000-000000000009', '4eecc92d-1735-48ca-b34a-f5509c4dfa6a', 3, 12, 30, 4);   -- Abducción Cadera

-- Movilidad + Core Activo
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, sort_order) VALUES
  ('a0000002-0000-0000-0000-000000000010', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 12, 30, 1),   -- Dead Bug
  ('a0000002-0000-0000-0000-000000000010', 'e6e1ffb9-d314-4309-8e76-f9df54c5a5a4', 3, 8, 45, 2),    -- Ab Wheel
  ('a0000002-0000-0000-0000-000000000010', '93b8f714-11f7-44f0-93ae-51a78c727a55', 3, 12, 30, 3),   -- Hiperextensiones
  ('a0000002-0000-0000-0000-000000000010', '3dda0a20-dcb9-406a-b788-b6deff75b105', 3, 10, 45, 4),   -- Leñador Polea
  ('a0000002-0000-0000-0000-000000000010', 'd316f217-4e14-4abe-86dc-bcf2fb66693e', 3, 12, 30, 5);   -- Aducción Cadera
