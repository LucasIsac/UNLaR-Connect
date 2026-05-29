# UNLaR-Connect

**UNLaR-Connect** es una plataforma web monolítica de alta fidelidad diseñada específicamente para estudiantes y tutores de la **Universidad Nacional de La Rioja (UNLaR)**. El proyecto fue desarrollado para resolver los desafíos planteados en el **Eje 3: Red Colaborativa Estudiantil (Intercambio de Conocimientos y Recursos)** de la Hackathon UNLaR.

---

## La Problemática (Eje 3 de la Hackathon)

A lo largo de su trayectoria universitaria, los estudiantes se enfrentan a dos grandes barreras estructurales:
1.  **Dificultad académica en materias filtro**: Asignaturas complejas donde la tasa de recursado es alta y la falta de apoyo continuo genera deserción.
2.  **Falta de acceso a insumos tecnológicos costosos**: La necesidad de equipamiento especializado (como placas Arduino, cámaras réflex, herramientas físicas, instrumental de laboratorio o licencias de software caras) que los estudiantes no siempre pueden costear.
3.  **El caos de los grupos masivos de WhatsApp**: Aunque en la comunidad universitaria abunda la buena voluntad de compañeros dispuestos a dar tutorías o prestar/alquilar el equipamiento que tienen guardado, la falta de un canal seguro, organizado e indexado hace que este flujo de ayuda se pierda por completo en el ruido diario de las redes sociales informales.

---

## La Solución: ¿Cómo lo resuelve UNLaR-Connect?

UNLaR-Connect transforma la interacción informal en una red académica estructurada, segura y gamificada:

### 1. Consultas Express y Tutorías en Vivo (Peer-to-Peer)
*   **Enlace de Audio/Video por WebRTC**: Los estudiantes con dificultades académicas pueden ver qué tutores certificados están en línea y solicitar una "Consulta Express" al instante. La plataforma inicia una llamada 1-on-1 segura, directa y con fallback inteligente para redes móviles.
*   **Descarga Contextual e Interacción**: Durante la llamada, los estudiantes chatean en tiempo real y acceden a los apuntes de la materia seleccionada sin salir de la sala.

### 2. Biblioteca Compartida e Inteligencia Artificial Localizada (RAG)
*   **Chat Interactivo con Apuntes**: Los estudiantes suben recursos de estudio (PDF, TXT, MD) que son segmentados y vectorizados en una base de datos local (`pgvector`). Un asistente de IA integrado permite "chatear" directamente con los apuntes utilizando terminología y **voseo argentino rioplatense** ("mirá", "tenés", "comentame").
*   **Filtros Inteligentes**: Búsquedas contextuales por carrera, materia y eje temático para encontrar apuntes de manera inmediata.

### 3. Red Organizada de Intercambio de Insumos y Recursos
*   **Foro Académico Estructurado**: Un espacio categorizado por materias y temas, reemplazando el desorden de WhatsApp. Los estudiantes pueden publicar dudas, responder hilos y coordinar préstamos o alquileres de insumos y herramientas tecnológicas que tienen guardadas.
*   **Seguridad e Indexación**: Cada recurso y publicación está asociado a un perfil verificado de la UNLaR, con trazabilidad completa.

### 4. Sistema de Reputación y Gamificación (Karma Ledger)
*   **Incentivo Real a la Colaboración**: Para motivar el intercambio de apuntes, la resolución de dudas en el foro y la disponibilidad para tutorías, la plataforma implementa un sistema transaccional de **Karma**.
*   **Niveles e Insignias**: Los estudiantes ganan puntos y desbloquean insignias reales (*Mentor Colaborativo*, *Participante Activo*) visibles en el ranking universitario, transformando el altruismo en un mérito académico reconocido.

---

## Stack Tecnológico y Arquitectura

UNLaR-Connect se concibe como un monolito altamente eficiente y con tipado estricto:
*   **Frontend**: Next.js 14 (App Router, React 18, TypeScript) con estilos Tailwind CSS y efecto *Glassmorphism* premium (Lumina Amber / Warm Obsidian).
*   **Backend Invisible**: Next.js Server Actions (`src/actions/`) para transacciones directas y seguras sin la latencia de APIs REST tradicionales.
*   **Base de Datos y Seguridad**: Supabase (PostgreSQL, seguridad Row-Level Security (RLS) y suscripciones en tiempo real).
*   **Procesamiento de IA (RAG)**: Búsqueda vectorial mediante `pgvector` combinando embeddings de **Google Gemini** (`text-embedding-004`) y procesamiento lingüístico con **Groq** (`llama-3.1-8b-instant`).

---

## Documentación del Sistema

Toda la estructura técnica y de directorios detallada está documentada en la carpeta [/docs](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/docs):

*   **[Arquitectura y Estructura](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/docs/architecture.md)**: Detalle del diseño monolítico de Server Actions, estructura de carpetas y directrices de diseño responsive móvil.
*   **[Esquema de Base de Datos y Seguridad](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/docs/database_schema.md)**: Glosario de tablas de Supabase, triggers PostgreSQL automatizados para el karma y políticas RLS.
*   **[Procesamiento Vectorial y RAG](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/docs/rag_ai_pipeline.md)**: Flujos de ingesta de archivos, división semántica (*sliding-window chunking*), embeddings y búsquedas de similitud.
*   **[Guía de Pruebas y Verificación](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/docs/testing_and_verification.md)**: Instrucciones detalladas de control de calidad para probar llamadas WebRTC, chatbot RAG y sistema de karma.

---

## Directrices e Inducción para Agentes de IA

Este repositorio está optimizado para el trabajo asistido por inteligencia artificial. Consulte [AGENTS.md](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/AGENTS.md) para alinearse con los estándares de desarrollo.

---

## Primeros Pasos

Siga estos pasos para ejecutar UNLaR-Connect localmente en modo de desarrollo:

### 1. Requisitos Previos
Asegúrese de tener instalado en su entorno:
*   Node.js (versión 18.x o superior)
*   npm (versión 9.x o superior)

### 2. Instalación
Clone el repositorio e instale las dependencias del proyecto:
```bash
git clone https://github.com/repositories/UNLaR-Connect.git
cd UNLaR-Connect
npm install
```

### 3. Configuración de Variables de Entorno
Cree un archivo `.env.local` en la raíz del proyecto con los parámetros de conexión de sus servicios:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_proyecto_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_supabase
FREELLMAPI_ENDPOINT=tu_punto_de_conexion_local_llm_api
```

### 4. Ejecución del Servidor de Desarrollo
Inicie el servidor de desarrollo local:
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) en su navegador para ver la página en funcionamiento.

### 5. Compilación para Producción
Verifique la compilación y el cumplimiento de ESLint:
```bash
npm run build
```

---

> [!NOTE]
> Toda contribución debe respetar los estándares de diseño móvil detallados en [.agents/rules/03-components.md](file:///.agents/rules/03-components.md). Mantenga la coherencia visual y funcional en dispositivos móviles y de escritorio.
