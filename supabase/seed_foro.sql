-- author: leo
-- Seed script for realistic /dashboard/foros data.
-- Safe to rerun: it removes only these six known demo posts for Leonardo before inserting them again.

DO $$
DECLARE
  leo_user_id uuid;
  question_type_id integer;
  advice_type_id integer;
  marketplace_type_id integer;
BEGIN
  SELECT id
  INTO leo_user_id
  FROM public.users
  WHERE id = '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469'
     OR email = 'leonardorearte0@gmail.com'
  LIMIT 1;

  IF leo_user_id IS NULL THEN
    RAISE EXCEPTION 'Leonardo user was not found in public.users. Sign in once before running this seed.';
  END IF;

  SELECT id INTO question_type_id
  FROM public.post_types
  WHERE name = 'Duda Académica'
  LIMIT 1;

  SELECT id INTO advice_type_id
  FROM public.post_types
  WHERE name = 'Consejo de Cursada'
  LIMIT 1;

  SELECT id INTO marketplace_type_id
  FROM public.post_types
  WHERE name = 'Compraventa'
  LIMIT 1;

  IF question_type_id IS NULL OR advice_type_id IS NULL OR marketplace_type_id IS NULL THEN
    RAISE EXCEPTION 'Required post types are missing. Run the base seed migration first.';
  END IF;

  DELETE FROM public.posts
  WHERE user_id = leo_user_id
    AND title IN (
      '¿Cómo configuramos los semáforos en C para el TP3?',
      'Resumen del Teorema de Green y Stokes - Examen Final',
      'Clases de Apoyo de Álgebra y Geometría Analítica',
      'Presto Kit Arduino Uno R3 Completo',
      'Busco prestado libro de UML y Patrones de Diseño',
      'Vendo Calculadora Científica Casio fx-95'
    );

  INSERT INTO public.posts (
    user_id,
    subject_id,
    post_type_id,
    title,
    content,
    upvotes,
    is_resolved,
    type,
    metadata
  ) VALUES
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Sistemas Operativos' LIMIT 1),
    question_type_id,
    '¿Cómo configuramos los semáforos en C para el TP3?',
    'Che, estoy trabadísimo con la sincronización de hilos en el TP de Sistemas Operativos. ¿Alguien me da una mano para entender cómo inicializar sem_t usando sem.h en Linux? ¡No le cazo la vuelta al TP!',
    4,
    false,
    'question',
    '{}'::jsonb
  ),
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Análisis Matemático II' LIMIT 1),
    advice_type_id,
    'Resumen del Teorema de Green y Stokes - Examen Final',
    'Comparto con ustedes mi apunte manuscrito digitalizado sobre integrales de línea y teoremas fundamentales del cálculo vectorial. Está súper resumido para rendir el final de AM II al toque. ¡Espero que les sirva!',
    12,
    true,
    'resource',
    '{}'::jsonb
  ),
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Álgebra' LIMIT 1),
    advice_type_id,
    'Clases de Apoyo de Álgebra y Geometría Analítica',
    '¿Te cuesta entender matrices, determinantes y espacios vectoriales? Preparo alumnos para el primer y segundo parcial. Las clases son dinámicas con pizarra virtual y ejercicios resueltos paso a paso.',
    8,
    false,
    'tutoring',
    '{"subject": "Álgebra", "price_type": "paid", "price": 1200, "modality": "hybrid", "availability": "Martes y jueves de 18:00 a 20:00 hs"}'::jsonb
  ),
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Programación I' LIMIT 1),
    marketplace_type_id,
    'Presto Kit Arduino Uno R3 Completo',
    'Tengo un kit de Arduino tirado en casa que no estoy usando este cuatrimestre. Viene con protoboard, cables puente, leds y sensores básicos de luz y temperatura. Si lo necesitás para arquitectura de computadoras o tu TP, pedímelo al toque.',
    15,
    false,
    'borrow',
    '{"item_name": "Kit Arduino Uno R3", "condition": "used_good", "location": "Módulo de Sistemas", "availability": "Miércoles de 14:00 a 18:00 hs", "status": "available"}'::jsonb
  ),
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Ingeniería de Software' LIMIT 1),
    marketplace_type_id,
    'Busco prestado libro de UML y Patrones de Diseño',
    'Hola compañeros. ¿Alguien tiene el libro físico de "UML y Patrones" de Craig Larman para prestarme por un par de semanas? Lo cuido como oro y lo devuelvo marcado con carpa. Es para preparar el integrador.',
    3,
    false,
    'borrow',
    '{"item_name": "Libro UML y Patrones de Larman", "condition": "used_fair", "location": "Biblioteca o Sede Central", "availability": "Lunes a viernes", "status": "available"}'::jsonb
  ),
  (
    leo_user_id,
    (SELECT id FROM public.subjects WHERE name = 'Álgebra' LIMIT 1),
    marketplace_type_id,
    'Vendo Calculadora Científica Casio fx-95',
    'Vendo mi calculadora científica Casio fx-95 en excelente estado y con su tapa protectora original. Tiene todas las funciones de trigonometría, estadística y cálculo de matrices necesarias para primer y segundo año. ¡Consultame sin compromiso!',
    5,
    false,
    'sell_rent',
    '{"item_name": "Calculadora Casio fx-95", "price": 4500, "condition": "used_good", "mode": "sell", "location": "Módulo de Sistemas o Sede Central"}'::jsonb
  );
END $$;
