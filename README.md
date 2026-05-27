# UNLaR-Connect

UNLaR-Connect es una aplicación web monolítica premium diseñada para estudiantes y tutores de la Universidad Nacional de La Rioja (UNLaR). Al combinar herramientas modernas de colaboración con inteligencia artificial localizada, la plataforma permite a los estudiantes compartir recursos de estudio, participar en foros específicos de materias, programar sesiones de tutoría entre pares (P2P) y chatear directamente con sus apuntes de clase en formato PDF.

---

## Stack Tecnológico y Arquitectura

UNLaR-Connect está desarrollado como un monolito altamente eficiente, con tipado estricto y cohesivo:

*   **Frontend y Enrutamiento**: Next.js 14 (App Router, React 18, TypeScript)
*   **Estilos**: Tailwind CSS con una paleta de colores premium (Amethyst Deep, Radiant Teal y tarjetas con efecto Glassmorphism de alta fidelidad)
*   **Backend Invisible**: Server Actions de Next.js (`src/actions/`) actuando como los controladores transaccionales del backend (sin la sobrecarga de APIs REST)
*   **Base de Datos y Seguridad**: Supabase (PostgreSQL, seguridad a nivel de fila - RLS, eventos en tiempo real y autenticación basada en cookies de sesión)
*   **Procesamiento de IA (RAG)**: Procesamiento vectorial local utilizando pgvector y búsqueda semántica a través de embeddings provistos por FreeLLMAPI

---

## Estructura de Directorios del Proyecto

```text
unlar-connect/
├── .agents/                 # DIRECTRICES ESPECÍFICAS PARA AGENTES DE IA
│   ├── rules/               # Estilo de código, localización y estándares de componentes
│   ├── skills/              # Integraciones con Supabase, pgvector y LLM
│   └── workflows/           # Configuración de autenticación y flujos de RAG
│
├── public/                  # Archivos estáticos públicos
│   ├── favicon.ico
│   └── logo-unlar-connect.svg
│
├── src/
│   ├── actions/             # SERVER ACTIONS (El "Backend Invisible")
│   │   ├── auth.ts          # Acciones de autenticación del servidor mediante Supabase
│   │   ├── documents.ts     # Procesamiento de PDFs, división en fragmentos (chunking) y metadatos
│   │   ├── embeddings.ts    # Generación de vectores de FreeLLMAPI y búsqueda semántica
│   │   └── forums.ts        # Transacciones de foros de discusión y programación de tutorías
│   │
│   ├── app/                 # RUTAS Y VISTAS (El UI del Frontend)
│   │   ├── (auth)/          # Páginas de autenticación (ingreso, registro)
│   │   ├── dashboard/       # Portal principal para el estudiante
│   │   ├── apuntes/         # Biblioteca de recursos y chatbot interactivo para PDFs (RAG)
│   │   ├── foros/           # Foros de discusión académica organizados por materia
│   │   ├── tutorias/        # Programación de tutorías entre pares (P2P)
│   │   ├── globals.css      # Variables globales de Tailwind y estilos glassmorphism
│   │   └── layout.tsx       # Estructura principal (fuentes Outfit e Inter, rejillas adaptables)
│   │
│   ├── components/          # COMPONENTES DE INTERFAZ REUTILIZABLES
│   │   ├── ui/              # Componentes base como botones, modales e inputs (shadcn/ui)
│   │   ├── layout/          # Barra de navegación lateral para escritorio y barra inferior para móvil
│   │   ├── documents/       # Áreas de carga de archivos (Drag & Drop)
│   │   └── chat/            # Paneles del asistente de IA e interfaces de transmisión de texto
│   │
│   ├── lib/                 # UTILIDADES E INICIALIZACIONES DE CLIENTES
│   │   ├── supabase.ts      # Cliente de autenticación y base de datos de Supabase
│   │   ├── freellmapi.ts    # Conexiones a modelos de embeddings y procesamiento
│   │   └── utils.ts         # Combinador estándar de clases de Tailwind CSS
│   │
│   └── types/               # ESQUEMAS DE TIPADO
│       ├── database.ts      # Tipado automático generado desde las tablas de Supabase
│       └── index.ts         # Tipos de datos para usuarios, documentos y mensajes
│
├── AGENTS.md                # Manual de inducción para agentes de IA
├── tailwind.config.ts       # Configuraciones de temas y animaciones
├── tsconfig.json            # Reglas de configuración estrictas de TypeScript
└── package.json             # Manifiesto de dependencias del proyecto
```

---

## Directrices e Inducción para Agentes de IA

Este repositorio está optimizado para la programación en pareja asistida por agentes autónomos de IA:
*   **Inducción**: Consulte [AGENTS.md](file:///c:/Users/Leo/Documents/Programming/github/repositories/UNLaR-Connect/AGENTS.md) para obtener una visión general de la estructura, reglas y guías de desarrollo.
*   **Política de Idioma Dual**:
    *   Los archivos orientados al **desarrollador** (como planes de implementación, tareas, comentarios de código y archivos `.md` del sistema) se escriben en **inglés**.
    *   La interfaz orientada al **usuario** (como botones, textos de ayuda, notificaciones y respuestas de chatbot de IA) se escribe en **español rioplatense (argentino)** de manera natural utilizando el voseo (*"Iniciá sesión"*, *"Subí tu PDF al toque"*, *"¿Buscás apuntes?"*).

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
Cree un archivo `.env.local` en la raíz del proyecto con los parámetros de conexión de sus servicios locales:
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
Abra [http://localhost:3000](http://localhost:3000) en su navegador para ver la página de inicio en funcionamiento.

### 5. Compilación para Producción
Verifique que el proyecto compile correctamente y cumpla con las directrices de ESLint:
```bash
npm run build
```

---

> [!NOTE]
> Toda contribución debe respetar los estándares de diseño móvil detallados en [.agents/rules/03-components.md](file:///.agents/rules/03-components.md). Mantenga la coherencia visual y funcional en dispositivos móviles y de escritorio.
