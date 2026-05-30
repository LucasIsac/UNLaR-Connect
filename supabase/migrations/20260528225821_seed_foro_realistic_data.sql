-- author: leo
-- Script de Semilla para Poblar /foro con Datos Realistas
-- Podés copiar y pegar este código directamente en la consola de SQL de tu Supabase Dashboard.
-- Utiliza el ID de usuario de tu perfil ('40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469') para que queden vinculados a tu cuenta.

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
-- 1. Pregunta (question)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  6, -- Sistemas Operativos
  1, -- Duda Académica (mapeo tradicional)
  '¿Cómo configuramos los semáforos en C para el TP3?',
  'Che, estoy trabadísimo con la sincronización de hilos en el TP de Sistemas Operativos. ¿Alguien me da una mano para entender cómo inicializar sem_t usando sem.h en Linux? ¡No le cazo la vuelta al TP!',
  4,
  false,
  'question',
  '{}'::jsonb
),

-- 2. Recurso (resource)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  2, -- Análisis Matemático II
  2, -- Consejo de Cursada / Recurso
  'Resumen del Teorema de Green y Stokes - Examen Final',
  'Comparto con ustedes mi apunte manuscrito digitalizado sobre integrales de línea y teoremas fundamentales del cálculo vectorial. Está súper resumido para rendir el final de AM II al toque. ¡Espero que les sirva!',
  12,
  true,
  'resource',
  '{}'::jsonb
),

-- 3. Tutoría (tutoring)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  8, -- Álgebra
  2, -- Consejo / Tutorías
  'Clases de Apoyo de Álgebra y Geometría Analítica',
  '¿Te cuesta entender matrices, determinantes y espacios vectoriales? Preparo alumnos para el primer y segundo parcial. Las clases son dinámicas con pizarra virtual y ejercicios resueltos paso a paso.',
  8,
  false,
  'tutoring',
  '{"subject": "Álgebra", "price_type": "paid", "price": 1200, "modality": "hybrid", "availability": "Martes y Jueves de 18:00 a 20:00 hs"}'::jsonb
),

-- 4. Préstamo 1 (borrow)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  3, -- Programación I
  3, -- Compraventa / Préstamo
  'Presto Kit Arduino Uno R3 Completo',
  'Tengo un kit de Arduino tirado en casa que no estoy usando este cuatrimestre. Viene con protoboard, cables puente, leds y sensores básicos de luz y temperatura. Si lo necesitás para arquitectura de computadoras o tu TP, pedímelo al toque.',
  15,
  false,
  'borrow',
  '{"item_name": "Kit Arduino Uno R3", "condition": "used_good", "location": "Módulo de Sistemas", "availability": "Miércoles de 14:00 a 18:00 hs", "status": "available"}'::jsonb
),

-- 5. Préstamo 2 (borrow)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  10, -- Ingeniería de Software
  3, -- Compraventa / Préstamo
  'Busco prestado libro de UML y Patrones de Diseño',
  'Hola compañeros. ¿Alguien tiene el libro físico de "UML y Patrones" de Craig Larman para prestarme por un par de semanas? Lo cuido como oro y lo devuelvo marcado con carpa. Es para preparar el integrador.',
  3,
  false,
  'borrow',
  '{"item_name": "Libro UML y Patrones de Larman", "condition": "used_fair", "location": "Biblioteca o Sede Central", "availability": "Lunes a Viernes", "status": "available"}'::jsonb
),

-- 6. Compra / Alquiler (sell_rent)
(
  '40c7cdd0-ad6d-4b1a-8a48-4e5d19c24469',
  8, -- Álgebra / Insumos
  3, -- Compraventa
  'Vendo Calculadora Científica Casio fx-95',
  'Vendo mi calculadora científica Casio fx-95 en excelente estado y con su tapa protectora original. Tiene todas las funciones de trigonometría, estadística y cálculo de matrices necesarias para primer y segundo año. ¡Consultame sin compromiso!',
  5,
  false,
  'sell_rent',
  '{"item_name": "Calculadora Casio fx-95", "price": 4500, "condition": "used_good", "mode": "sell", "location": "Módulo de Sistemas o Sede Central"}'::jsonb
);;
