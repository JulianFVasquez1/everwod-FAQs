# Everwod FAQ Cloud

Plataforma integral para la **detección automática de patrones conversacionales** y generación de FAQs para los bots de WhatsApp de Everwod. Combina dos pipelines de IA independientes —un detector NLP desplegado en Hugging Face Spaces y un generador local basado en Google Gemini— con un panel de revisión humana unificado.

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura General](#arquitectura-general)
- [Pipelines de Generación de FAQs](#pipelines-de-generación-de-faqs)
- [Páginas y Funcionalidades](#páginas-y-funcionalidades)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes Principales](#componentes-principales)
- [API Routes](#api-routes)
- [Hooks Personalizados](#hooks-personalizados)
- [Gráficas y Visualización](#gráficas-y-visualización)
- [Seguridad](#seguridad)
- [Evaluación y Métricas](#evaluación-y-métricas)
- [Variables de Entorno](#variables-de-entorno)
- [Cómo Correr Localmente](#cómo-correr-localmente)
- [Despliegue](#despliegue)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 14 (App Router + Pages API), React 18, TypeScript |
| **Estilos** | Tailwind CSS 3.4 con tema personalizado (dark mode, variables CSS) |
| **Base de Datos** | Supabase (PostgreSQL + Storage + Auth) |
| **IA — Pipeline Detector** | sentence-transformers (embeddings), HDBSCAN (clustering), Qwen-72B (síntesis) |
| **IA — Pipeline Local** | Google Gemini 3.5 Flash (`@google/generative-ai`) |
| **Animaciones** | Framer Motion, GSAP, Lenis (smooth scroll) |
| **3D** | Three.js / React-Three-Fiber / Drei |
| **Backend Detector** | FastAPI (Python) en Hugging Face Spaces |
| **Despliegue Frontend** | Vercel (con Cron Jobs) |

---

## Arquitectura General

El sistema orquesta **dos pipelines** que escriben en la **misma tabla `faqs`** de Supabase, permitiendo gestionar todas las FAQs desde una sola interfaz:

```
                    ┌──────────────────────────────────────────┐
                    │  SUPABASE de EVERWOD (producción)        │
                    │  chat_messages · agent_chats · agents    │
                    └──────────────────────────────────────────┘
                                       │ (1) lee via DATABASE_URL
                                       ▼
┌────────────────────────────────────────────────────────────────┐
│  BACKEND HF SPACE  (everwod-faq-detector · FastAPI · Python)   │
│  Pipeline NLP:                                                 │
│   extract → clean → embeddings (sentence-transformers          │
│   paraphrase-multilingual-MiniLM-L12-v2) → clustering          │
│   (HDBSCAN) → dedupe (cosine ≥ 0.85) → síntesis Q&A           │
│   (Qwen/Qwen2.5-72B-Instruct vía HF Inference)                │
│                                                                │
│  Endpoints: /api/v1/{suggestions, pipeline, metrics,           │
│             workspaces}  +  /health, /docs                     │
│  Auth: X-API-Key  |  Rate limit: slowapi  |  SSE: real-time   │
└────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ (2) Proxy server-side
                                       │     con X-API-Key
┌────────────────────────────────────────────────────────────────┐
│  FRONTEND  (Next.js 14 · Vercel)                               │
│                                                                │
│  pages/api/detector/[...path].ts  → proxy a HF Space           │
│  pages/api/{upload, generate-faqs, faqs, stats, cron}          │
│                                                                │
│  Páginas:                                                      │
│   /               → Landing con hero 3D                        │
│   /dashboard      → métricas + gráficas SVG del detector       │
│   /suggestions    → revisar sugerencias (aprobar/rechazar)     │
│   /upload         → subir CSV/JSON/TXT con drag & drop         │
│   /files/[id]     → ver archivo + FAQs derivadas               │
│   /evaluation     → métricas agregadas de FAQs locales         │
│   /login          → autenticación con Supabase Auth            │
└────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ (3) dual-write
┌────────────────────────────────────────────────────────────────┐
│  SUPABASE LOCAL                                                │
│  Tablas: files · faqs                                          │
│  Storage: bucket "files"                                       │
│  Auth: sesiones JWT                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## Pipelines de Generación de FAQs

### Pipeline A — Detector NLP (HF Space) · Fuente principal

Analiza conversaciones reales de WhatsApp en producción y propone FAQs mediante clustering semántico + LLM.

| Etapa | Tecnología |
|---|---|
| Lectura | SQLAlchemy → Supabase Pooler (BD producción Everwod) |
| Limpieza | Filtros de ruido (saludos, "ok", "gracias"), normalización |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Clustering | HDBSCAN sobre vectores L2-normalizados |
| Deduplicación | Cosine similarity ≥ 0.85 vs FAQs existentes |
| Síntesis | `Qwen/Qwen2.5-72B-Instruct` vía HF Inference |
| Persistencia | Tablas `faq_suggestions` + `pipeline_runs` (auditoría) |
| Scheduler | APScheduler — cron diario configurable |

Disparable manualmente desde el frontend (`POST /pipeline/run` con `Idempotency-Key`) o automáticamente por el scheduler.

### Pipeline B — Generador Local · Flujo secundario

Toma documentos subidos por el usuario y genera FAQs con clustering TF-IDF + Google Gemini.

| Etapa | Tecnología |
|---|---|
| Upload | `pages/api/upload.ts` → Supabase Storage + tabla `files` |
| Clustering | TF-IDF local (`lib/nlp/embeddings.ts → simpleCluster`) |
| Síntesis | Google Gemini 3.5 Flash (`@google/generative-ai`) |
| Persistencia | Inserta en tabla `faqs` con `file_id` y `status=pending` |
| Cron automático | Vercel Cron `/api/cron/process-pending` cada 24h |

---

## Páginas y Funcionalidades

| Ruta | Descripción |
|---|---|
| `/` | **Landing page** con hero 3D interactivo (poliedro Three.js), sección de pasos, stats en tiempo real y animaciones GSAP/Framer Motion |
| `/login` | Autenticación via Supabase Auth (sesión JWT) |
| `/upload` | Subida de archivos CSV/JSON/TXT con **drag & drop**, validación de extensión + tamaño + magic bytes, y feedback visual |
| `/files/[id]` | Vista detallada de archivo: preview del contenido + FAQs generadas con acciones (aprobar/editar/rechazar) |
| `/dashboard` | Panel de métricas del detector: gráficas SVG animadas (donut de estados, barras por categoría, timeline del pipeline, barras por workspace), detalle de workspace, y health badge en tiempo real |
| `/suggestions` | Listado de sugerencias del detector con filtros por workspace, acciones individuales (aprobar/rechazar con modal) y operaciones en lote |
| `/suggestions/[id]` | Detalle individual de una sugerencia |
| `/evaluation` | Métricas de evaluación agregadas de las FAQs locales: precisión, volumen, distribución por categoría |

---

## Estructura del Proyecto

```
everwood-faq-cloud/
├── app/                          # App Router (Next.js 14)
│   ├── page.tsx                  # Landing page con hero 3D
│   ├── layout.tsx                # Layout raíz
│   ├── globals.css               # Estilos globales + variables CSS
│   ├── dashboard/page.tsx        # Panel de métricas del detector
│   ├── evaluation/               # Métricas de evaluación
│   ├── files/                    # Vista de archivos individuales
│   ├── login/                    # Autenticación
│   ├── suggestions/              # Sugerencias del detector
│   │   ├── page.tsx              # Listado con filtros
│   │   └── [id]/                 # Detalle individual
│   └── upload/                   # Subida de archivos
│
├── pages/api/                    # API Routes (Pages Router)
│   ├── upload.ts                 # Upload a Supabase Storage
│   ├── generate-faqs.ts          # Generación de FAQs con Gemini
│   ├── preview.ts                # Preview de contenido de archivo
│   ├── stats.ts                  # Estadísticas generales
│   ├── faqs/                     # CRUD de FAQs locales
│   │   ├── index.ts              # GET (listar) / POST (crear)
│   │   └── [id].ts               # PATCH (actualizar status)
│   ├── files/                    # Gestión de archivos
│   │   ├── index.ts              # Listar archivos
│   │   └── [id].ts               # Detalle de archivo
│   ├── stats/
│   │   └── evaluation.ts         # Métricas de evaluación
│   ├── cron/
│   │   └── process-pending.ts    # Cron job: procesar archivos pendientes
│   └── detector/
│       └── [...path].ts          # Proxy catch-all al HF Space
│
├── components/
│   ├── FileUploader.tsx          # Uploader con drag & drop
│   ├── FilePreview.tsx           # Preview de contenido
│   ├── AuthGuard.tsx             # Protección de rutas autenticadas
│   ├── LogoutButton.tsx          # Botón de cierre de sesión
│   ├── StatusBadge.tsx           # Badge de estado de FAQ
│   ├── layout/
│   │   ├── Header.tsx            # Header con navegación y health badge
│   │   └── LayoutShell.tsx       # Shell del layout general
│   ├── sections/
│   │   ├── StepsSection.tsx      # Sección "cómo funciona" del landing
│   │   └── StatsDashboard.tsx    # Dashboard de stats en landing
│   ├── three/
│   │   └── Polyhedron3D.tsx      # Poliedro 3D interactivo (hero)
│   ├── ui/
│   │   ├── CircularProgress.tsx  # Indicador de progreso circular
│   │   ├── CustomCursor.tsx      # Cursor personalizado animado
│   │   ├── FAQCard.tsx           # Tarjeta de FAQ
│   │   ├── ParticleField.tsx     # Campo de partículas animado
│   │   └── UploadAnimation.tsx   # Animación de subida
│   ├── detector/
│   │   ├── ApproveModal.tsx      # Modal de aprobación
│   │   ├── RejectModal.tsx       # Modal de rechazo
│   │   ├── SuggestionCard.tsx    # Tarjeta de sugerencia
│   │   ├── SkeletonCard.tsx      # Skeleton loader
│   │   ├── WorkspaceSelect.tsx   # Selector de workspace
│   │   ├── WorkspaceDetailCard.tsx # Detalle de workspace
│   │   ├── EmptyDashboard.tsx    # Estado vacío del dashboard
│   │   └── charts/
│   │       ├── StatusDonut.tsx   # Gráfica donut de estados
│   │       ├── CategoryBars.tsx  # Barras por categoría
│   │       ├── WorkspaceBars.tsx # Barras apiladas por workspace
│   │       └── PipelineTimeline.tsx # Timeline de corridas
│   └── providers/                # Context providers
│
├── hooks/
│   ├── useDetector.ts            # Sugerencias, acciones, filtros
│   ├── useDetectorHealth.ts      # Health check polling (60s)
│   ├── useRunPipeline.ts         # Disparar pipeline + SSE streaming
│   ├── useWorkspaces.ts          # Listado de workspaces
│   └── useWorkspaceDetail.ts     # Detalle de workspace individual
│
├── lib/
│   ├── supabase.ts               # Clientes Supabase (anon + service)
│   ├── auth.ts                   # Helpers de autenticación
│   ├── anthropic.ts              # Cliente Anthropic (legacy, no activo)
│   ├── theme.ts                  # Sistema de diseño y tokens
│   ├── types.ts                  # Tipos globales (File, FAQ, etc.)
│   ├── utils.ts                  # Utilidades generales
│   ├── validators.ts             # Validación de archivos (ext, size, magic)
│   ├── detector/
│   │   ├── client.ts             # Cliente HTTP tipado para el proxy
│   │   ├── types.ts              # Tipos del detector (alineados con Pydantic)
│   │   └── index.ts              # Re-exports
│   └── nlp/
│       └── embeddings.ts         # TF-IDF + clustering local
│
├── scripts/
│   ├── simulate-activity.js      # Simular actividad en la BD
│   └── simulate-massive.js       # Simular carga masiva
│
├── vercel.json                   # Cron jobs + function config
├── tailwind.config.ts            # Tema Tailwind (dark mode, tokens)
├── next.config.mjs               # Configuración Next.js
├── tsconfig.json                 # Configuración TypeScript
└── ARCHITECTURE.md               # Documentación técnica detallada
```

---

## Componentes Principales

### Layout y Navegación
- **`Header.tsx`** — Barra de navegación con links a todas las secciones y badge de salud del detector (polling en tiempo real vía `useDetectorHealth`)
- **`LayoutShell.tsx`** — Shell que envuelve las páginas con el header
- **`AuthGuard.tsx`** — HOC que protege rutas autenticadas redirigiendo a `/login`

### Landing Page
- **`Polyhedron3D.tsx`** — Poliedro 3D animado con React-Three-Fiber como hero visual
- **`StepsSection.tsx`** — Sección "Cómo Funciona" con íconos animados
- **`StatsDashboard.tsx`** — Stats en tiempo real del sistema
- **`ParticleField.tsx`** — Campo de partículas como fondo decorativo
- **`CustomCursor.tsx`** — Cursor personalizado con efectos hover

### Upload Flow
- **`FileUploader.tsx`** — Componente drag & drop con validación visual, progreso animado y feedback de éxito/error
- **`UploadAnimation.tsx`** — Animación Framer Motion durante la subida
- **`CircularProgress.tsx`** — Indicador circular de progreso

### Detector & Dashboard
- **`SuggestionCard.tsx`** — Tarjeta de sugerencia con pregunta, respuesta, categoría, confianza y acciones
- **`ApproveModal.tsx` / `RejectModal.tsx`** — Modales de confirmación con campos opcionales
- **`WorkspaceSelect.tsx`** — Selector dropdown de workspace
- **`WorkspaceDetailCard.tsx`** — Detalle expandido de un workspace (top categorías, breakdown, último run)
- **`EmptyDashboard.tsx`** — Estado vacío con call to action

### Gráficas (SVG nativo + Framer Motion)
- **`StatusDonut.tsx`** — Donut chart con distribución pending/approved/rejected/edited
- **`CategoryBars.tsx`** — Barras horizontales por categoría (color = approval rate)
- **`WorkspaceBars.tsx`** — Barras apiladas por workspace (approved/pending/rejected)
- **`PipelineTimeline.tsx`** — Timeline de corridas del pipeline (últimos 14 días)

---

## API Routes

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/upload` | `POST` | Sube archivo a Supabase Storage, valida extensión/tamaño/magic bytes, clasifica contenido e inserta metadatos |
| `/api/generate-faqs` | `POST` | Genera FAQs con Gemini a partir de un `fileId` |
| `/api/preview` | `GET` | Preview del contenido de un archivo |
| `/api/stats` | `GET` | Estadísticas generales del sistema |
| `/api/faqs` | `GET/POST` | Listar y crear FAQs |
| `/api/faqs/[id]` | `PATCH` | Actualizar estado de una FAQ (approve/reject/edit) |
| `/api/files` | `GET` | Listar archivos subidos |
| `/api/files/[id]` | `GET` | Detalle de un archivo |
| `/api/stats/evaluation` | `GET` | Métricas de evaluación (precisión, distribución) |
| `/api/cron/process-pending` | `GET` | Cron job automático (cada 24h): procesa archivos pendientes |
| `/api/detector/[...path]` | `ANY` | Proxy catch-all al backend HF Space (inyecta `X-API-Key` server-side) |

---

## Hooks Personalizados

| Hook | Propósito |
|---|---|
| `useDetector` | Gestión completa de sugerencias: fetch, filtrado por workspace, aprobación individual/lote, rechazo |
| `useDetectorHealth` | Polling cada 60s al `/health` del detector, expone estado de DB, scheduler y HF Inference |
| `useRunPipeline` | Dispara un pipeline run con `Idempotency-Key`, consume SSE en tiempo real para progreso |
| `useWorkspaces` | Lista los workspaces disponibles en el detector |
| `useWorkspaceDetail` | Detalle de un workspace: top categorías, breakdown de estados, último run |

---

## Gráficas y Visualización

Todas las gráficas son **SVG nativo animado con Framer Motion**, sin dependencias externas de charting:

| Componente | Datos |
|---|---|
| `StatusDonut` | `metrics.overview.{pending, approved, rejected, edited}` |
| `CategoryBars` | `metrics.by_category[]` — color basado en `approval_rate` |
| `WorkspaceBars` | `metrics.by_workspace[]` — barras apiladas (approved/pending/rejected) |
| `PipelineTimeline` | `runs[]` agrupados por día (últimos 14 días) |
| `WorkspaceDetailCard` | `GET /workspaces/{id}` — top categorías + breakdown + last run |

---

## Seguridad

- **Proxy server-side** — La `X-API-Key` del detector se envía únicamente desde `pages/api/detector/[...path].ts`, nunca se expone al cliente
- **Supabase** — Clave `service_role` solo en endpoints de servidor; clave `anon` en el cliente
- **Validación de uploads** — Triple validación: extensión permitida + límite de tamaño + verificación de magic bytes
- **CORS** — El backend HF restringe orígenes a dominios de Vercel
- **Rate limiting** — En el backend HF vía slowapi, por IP + workspace
- **Autenticación** — Supabase Auth con sesión JWT, rutas protegidas por `AuthGuard`
- **Health check** — Badge en el header con polling cada 60s al `/health` del detector

---

## Evaluación y Métricas

El sistema mide su propio desempeño mediante:

| Métrica | Fórmula / Fuente |
|---|---|
| **Precisión** | `approved / (approved + rejected)` por categoría |
| **Calidad del clustering** | `avg_silhouette_score` del pipeline |
| **Confianza del sintetizador** | `avg_confidence_score` en métricas generales |
| **Cobertura temporal** | `trends.suggestions_last_{7,30}_days` |
| **Deduplicación efectiva** | `suggestions_skipped` por corrida (clusters ya cubiertos por FAQ existente) |

---

## Variables de Entorno

Crea un archivo `.env.local` en la raíz basado en `.env.local.example`:

```env
# Supabase local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# IA — Pipeline local (generación de FAQs desde archivos)
GEMINI_API_KEY=tu_clave_gemini_aqui

# Detector HF Space — Pipeline principal
DETECTOR_URL=https://dulceychon-everwod-faq-detector.hf.space
# Clave compartida con el backend. NUNCA usar prefijo NEXT_PUBLIC_
DETECTOR_API_KEY=

# URL pública de la app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Nunca subas tus credenciales reales al repositorio.** Usa `.env.local.example` como referencia.

---

## Cómo Correr Localmente

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/JulianFVasquez1/everwod-FAQs.git
   cd everwod-FAQs
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.local.example .env.local
   # Edita .env.local con tus credenciales
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre** [http://localhost:3000](http://localhost:3000) en tu navegador

> **Nota:** El script `dev` asigna `--max-old-space-size=8192` para evitar errores de memoria durante el desarrollo.

---

## Despliegue

La aplicación está diseñada para **Vercel**:

1. Crea un nuevo proyecto en Vercel y enlaza el repositorio de GitHub
2. Configura **todas** las variables de entorno (ver sección anterior):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `DETECTOR_URL`
   - `DETECTOR_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Ejecuta las migraciones SQL en Supabase (tablas `files`, `faqs`) antes del primer deploy
4. Despliega con `vercel --prod` o push a la rama principal

### Configuración de Vercel (`vercel.json`)

- **Funciones extendidas**: `upload.ts` y `detector/[...path].ts` con `maxDuration: 60s`
- **Cron Job**: `/api/cron/process-pending` ejecuta diariamente a las 00:00 UTC para procesar archivos pendientes

---

## Documentación Adicional

- 📐 [ARCHITECTURE.md](./ARCHITECTURE.md) — Documentación técnica detallada con diagramas de flujo, mapa de servicios y decisiones de diseño
