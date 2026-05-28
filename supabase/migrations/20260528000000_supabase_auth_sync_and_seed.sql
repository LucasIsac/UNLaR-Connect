-- Migration: Supabase Auth Sync Trigger & Initial Seeding
-- Created: 2026-05-28

-- 1. Create a Sync Trigger to populate public.users on sign-ups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, last_name, role_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'name', 'Estudiante'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    2 -- Default to Estudiante (ID: 2)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Seed Roles
INSERT INTO public.roles (id, name, description) VALUES
(1, 'Administrador', 'Acceso total de administración'),
(2, 'Estudiante', 'Usuario estudiante de la UNLaR'),
(3, 'Tutor', 'Estudiante tutor calificado')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Seed Careers
INSERT INTO public.careers (id, name, plan_study, description) VALUES
(1, 'Ingeniería en Sistemas de Información', '2015', 'Carrera de grado en desarrollo de software y sistemas'),
(2, 'Licenciatura en Ciencias de la Computación', '2020', 'Carrera de grado enfocada en ciencias de la computación'),
(3, 'Tecnicatura en Informática', '2018', 'Carrera corta de formación técnica')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan_study = EXCLUDED.plan_study;

-- 4. Seed Subjects
INSERT INTO public.subjects (id, name, year) VALUES
(1, 'Análisis Matemático I', 1),
(2, 'Análisis Matemático II', 2),
(3, 'Programación I', 1),
(4, 'Programación II', 2),
(5, 'Paradigmas de Programación', 3),
(6, 'Sistemas Operativos', 3),
(7, 'Bases de Datos', 3),
(8, 'Álgebra', 1),
(9, 'Física I', 1),
(10, 'Ingeniería de Software', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, year = EXCLUDED.year;

-- 5. Seed Post Types
INSERT INTO public.post_types (id, name, description) VALUES
(1, 'Duda Académica', 'Preguntas referentes a contenidos de materias'),
(2, 'Consejo de Cursada', 'Tips y consejos para llevar la materia al día'),
(3, 'Compraventa', 'Libros, apuntes, calculadoras o insumos universitarios')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 6. Seed Badges
INSERT INTO public.badges (id, name, description, icon_name, required_points) VALUES
(1, 'Colaborador Destacado', 'Otorgado por responder 5 dudas en los foros comunitarios.', 'forum', 500),
(2, 'Tutor Estrella', 'Alcanzado al mantener un rating superior a 4.5 en 10 tutorías.', 'handshake', 1000),
(3, 'Lector Veloz', 'Otorgado por leer 20 recursos en el banco de apuntes.', 'menu_book', 3000)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
