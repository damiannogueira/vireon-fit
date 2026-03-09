
-- Create female-specific global routines
INSERT INTO workouts (id, name, description, goal_type, difficulty, estimated_duration, is_global, target_gender) VALUES
('b0000001-0000-0000-0000-000000000001', 'Glúteos & Piernas - Fuerza Femenina', 'Rutina enfocada en glúteos, isquiotibiales y cuádriceps con pesos moderados', 'fuerza', 'intermediate', 50, true, 'female'),
('b0000001-0000-0000-0000-000000000002', 'Tren Superior Tonificación', 'Brazos, hombros y espalda con peso moderado y altas repeticiones', 'hipertrofia', 'beginner', 40, true, 'female'),
('b0000001-0000-0000-0000-000000000003', 'Full Body Quema Grasa Mujer', 'Circuito full body con descansos cortos para máxima quema calórica', 'perdida_grasa', 'intermediate', 35, true, 'female'),
('b0000001-0000-0000-0000-000000000004', 'Piernas & Glúteos Hipertrofia', 'Volumen alto para crecimiento muscular en tren inferior', 'hipertrofia', 'intermediate', 55, true, 'female'),
('b0000001-0000-0000-0000-000000000005', 'Core & Glúteos Express', 'Sesión corta enfocada en abdomen y glúteos', 'general', 'beginner', 30, true, 'female'),
('b0000001-0000-0000-0000-000000000006', 'Movilidad & Flexibilidad Mujer', 'Estiramientos y movilidad articular adaptada', 'movilidad', 'beginner', 30, true, 'female');

-- Add exercises to female routines
-- Glúteos & Piernas - Fuerza Femenina
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000001', '2727294f-e061-4076-9187-b65b83c1a60d', 4, 12, 90, 30, 1),  -- Hip Thrust
('b0000001-0000-0000-0000-000000000001', '7e73d1c2-e486-4a3d-ac18-51b505c694a6', 4, 10, 90, 25, 2),  -- Sentadilla con Barra
('b0000001-0000-0000-0000-000000000001', 'ddc7298f-b30c-4b09-9b21-2494d94408aa', 3, 12, 75, 20, 3),  -- Peso Muerto Rumano
('b0000001-0000-0000-0000-000000000001', '17d64491-6cd2-4cb0-8d8b-a4b8aae7c8ec', 3, 10, 75, 10, 4),  -- Sentadilla Búlgara
('b0000001-0000-0000-0000-000000000001', '4eecc92d-1735-48ca-b34a-f5509c4dfa6a', 3, 15, 60, 15, 5),  -- Abducción de Cadera
('b0000001-0000-0000-0000-000000000001', '0ce172fb-4830-4056-b8e5-7168b92aed67', 3, 15, 60, 0, 6);   -- Elevación de Talones

-- Tren Superior Tonificación
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000002', 'd0777bae-86cb-4cb1-9369-1853b1b1c1ce', 3, 12, 60, 0, 1),   -- Flexiones
('b0000001-0000-0000-0000-000000000002', '269c9924-2ded-4ce9-8c3f-10ec4ce1f252', 3, 12, 60, 20, 2),   -- Jalón al Pecho
('b0000001-0000-0000-0000-000000000002', '1b8dccac-3308-43f5-bd49-01b2fb9fe9c1', 3, 12, 60, 6, 3),    -- Press Inclinado Mancuernas
('b0000001-0000-0000-0000-000000000002', 'a708a48e-8c7c-48a4-85c7-014fccafd3fe', 3, 15, 60, 5, 4),    -- Aperturas Cable
('b0000001-0000-0000-0000-000000000002', '93b8f714-11f7-44f0-93ae-51a78c727a55', 3, 12, 60, 0, 5);    -- Hiperextensiones

-- Full Body Quema Grasa Mujer
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000003', 'b80c4f93-fda6-4867-8804-24594cf7cfd1', 3, 15, 45, 8, 1),   -- Sentadilla Goblet
('b0000001-0000-0000-0000-000000000003', 'd0777bae-86cb-4cb1-9369-1853b1b1c1ce', 3, 12, 45, 0, 2),   -- Flexiones
('b0000001-0000-0000-0000-000000000003', '5fa9f4e7-5e2a-4e9e-b42c-f8cd30d56f24', 3, 12, 45, 6, 3),   -- Zancadas con Mancuernas
('b0000001-0000-0000-0000-000000000003', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 3, 15, 30, 0, 4),   -- Crunch
('b0000001-0000-0000-0000-000000000003', '2727294f-e061-4076-9187-b65b83c1a60d', 3, 15, 45, 20, 5);   -- Hip Thrust

-- Piernas & Glúteos Hipertrofia
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000004', '2727294f-e061-4076-9187-b65b83c1a60d', 4, 12, 90, 35, 1),   -- Hip Thrust
('b0000001-0000-0000-0000-000000000004', 'fa0eb128-ec33-4daa-b905-103bc0ae2884', 4, 12, 90, 50, 2),   -- Prensa de Piernas
('b0000001-0000-0000-0000-000000000004', 'ae0d338f-deb3-473d-9fff-a8e6783d440c', 3, 12, 75, 15, 3),   -- Curl Femoral
('b0000001-0000-0000-0000-000000000004', '6b796103-6d48-4ad7-8792-3eb535a5f84d', 3, 15, 60, 15, 4),   -- Extensión de Cuádriceps
('b0000001-0000-0000-0000-000000000004', '4eecc92d-1735-48ca-b34a-f5509c4dfa6a', 3, 20, 60, 15, 5),   -- Abducción
('b0000001-0000-0000-0000-000000000004', 'd316f217-4e14-4abe-86dc-bcf2fb66693e', 3, 20, 60, 15, 6);   -- Aducción

-- Core & Glúteos Express
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000005', '2727294f-e061-4076-9187-b65b83c1a60d', 3, 15, 60, 20, 1),   -- Hip Thrust
('b0000001-0000-0000-0000-000000000005', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 3, 20, 45, 0, 2),    -- Crunch
('b0000001-0000-0000-0000-000000000005', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 10, 45, 0, 3),    -- Dead Bug
('b0000001-0000-0000-0000-000000000005', '4eecc92d-1735-48ca-b34a-f5509c4dfa6a', 3, 15, 45, 10, 4);   -- Abducción

-- Movilidad & Flexibilidad Mujer (reuse core/legs exercises at low intensity)
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, default_weight, sort_order) VALUES
('b0000001-0000-0000-0000-000000000006', '94d5dc8a-f0ba-4c3f-bf4b-26469c1244d8', 3, 10, 45, 0, 1),    -- Dead Bug
('b0000001-0000-0000-0000-000000000006', '93b8f714-11f7-44f0-93ae-51a78c727a55', 3, 12, 45, 0, 2),    -- Hiperextensiones
('b0000001-0000-0000-0000-000000000006', 'e935c4a3-3a81-4e3e-b627-d8901b8db369', 2, 15, 30, 0, 3);    -- Crunch suave
