# UNLaR-Connect

## Arquitectura del Proyecto

```text
unlar-connect/
├── public/                 # Archivos estáticos públicos
│   ├── favicon.ico
│   └── logo-unlar-connect.svg
│
├── src/
│   ├── actions/            # LÓGICA DE SERVIDOR (El Backend "Invisible")
│   │   ├── auth.ts         # Server actions para login/registro con Supabase
│   │   ├── documents.ts    # Procesamiento de PDFs, chunking y guardado
│   │   ├── embeddings.ts   # Conexión a FreeLLMAPI (pgvector y RAG)
│   │   └── forums.ts       # Lógica transaccional de foros y tutorías
│   │
│   ├── app/                # RUTAS Y VISTAS (El Frontend)
│   │   ├── (auth)/         # Grupo de rutas de autenticación
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── dashboard/      # Pantalla principal del alumno
│   │   │   └── page.tsx
│   │   ├── apuntes/        # Módulo: Banco de Recursos
│   │   │   ├── page.tsx          # Listado con filtros
│   │   │   └── [id]/page.tsx     # Vista detalle de un apunte + Chatbot
│   │   ├── foros/          # Módulo: Foros por Materia
│   │   │   ├── page.tsx
│   │   │   └── [materiaId]/page.tsx
│   │   ├── tutorias/       # Módulo: Tutorías P2P
│   │   │   └── page.tsx
│   │   ├── globals.css     # Estilos globales de Tailwind
│   │   └── layout.tsx      # Estructura maestra (Navbar, menús de navegación)
│   │
│   ├── components/         # COMPONENTES UI REUTILIZABLES (Mobile-First)
│   │   ├── ui/             # Componentes base (shadcn/ui: botones, modales, inputs)
│   │   ├── layout/         # Componentes de estructura (Header, BottomNav móvil)
│   │   ├── documents/      # Componente Dropzone (Drag & Drop para PDFs)
│   │   └── chat/           # Componente de la ventana del asistente IA
│   │
│   ├── lib/                # UTILIDADES Y CONFIGURACIONES CORE
│   │   ├── supabase.ts     # Instancia del cliente de Supabase
│   │   ├── freellmapi.ts   # Configuración de los endpoints locales de IA
│   │   └── utils.ts        # Funciones auxiliares (formatear fechas, clases Tailwind)
│   │
│   └── types/              # DEFINICIONES DE TIPOS (TypeScript)
│       ├── database.ts     # Tipos generados automáticamente desde Supabase
│       └── index.ts        # Interfaces propias (Ej: Usuario, Documento, MensajeChat)
│
├── .env.local              # Variables de entorno (¡NO SUBIR A GITHUB!)
├── components.json         # Configuración de shadcn/ui
├── next.config.mjs         # Configuración del framework Next.js
├── tailwind.config.ts      # Configuración de la paleta de colores oficial
├── tsconfig.json           # Configuración estricta de TypeScript
└── package.json            # Dependencias del proyecto
```
