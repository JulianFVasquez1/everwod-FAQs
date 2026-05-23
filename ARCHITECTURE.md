# Arquitectura del Sistema: Everwod FAQ Cloud

## Visión General

Plataforma de gestión de FAQs para los bots de WhatsApp de Everwod. Combina **dos pipelines independientes** de detección/generación de FAQs y un panel de revisión humana unificado:

1. **Pipeline del detector (HF Space)** — analiza conversaciones reales de WhatsApp en producción y propone FAQs vía clustering semántico + LLM.
2. **Pipeline local de archivos** — toma documentos (CSV/JSON/TXT) subidos por el usuario y genera FAQs vía clustering TF-IDF + LLM.

Ambos pipelines escriben en la **misma tabla `faqs` de la BD local de Supabase**, lo que permite al admin gestionarlas desde una sola interfaz.

## Mapa de servicios

```
                    ┌──────────────────────────────────────────┐
                    │  SUPABASE de EVERWOD (producción)        │
                    │  chat_messages · agent_chats · agents    │
                    └──────────────────────────────────────────┘
                                       │ (1) lee via DATABASE_URL
                                       ▼
┌────────────────────────────────────────────────────────────────┐
│  BACKEND HF SPACE  (everwod-faq-detector · FastAPI · Python)   │
│  ──────────────────────────────────────────────────────────    │
│  Pipeline NLP:                                                 │
│   extract → clean → embeddings (sentence-transformers          │
│   `paraphrase-multilingual-MiniLM-L12-v2`) → clustering        │
│   (HDBSCAN, vectores L2-normalizados) → dedupe vs FAQs         │
│   existentes (cosine ≥ 0.85) → síntesis Q&A                    │
│   (`Qwen/Qwen2.5-72B-Instruct` vía HF Inference Providers)     │
│                                                                │
│  Persistencia: tablas `faq_suggestions`, `pipeline_runs`       │
│  Endpoints: /api/v1/{suggestions, pipeline, metrics,           │
│             workspaces}  +  /health, /docs                     │
│  Auth: X-API-Key obligatoria (excepto /health, /docs)          │
│  Rate limit: por `ip:workspace_id` (slowapi)                   │
│  Real-time: SSE en /pipeline/runs/{id}/stream                  │
└────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ (2) GET/POST con X-API-Key
                                       │     via proxy server-side
                                       │
┌────────────────────────────────────────────────────────────────┐
│  FRONTEND  (everwod-FAQs · Next.js 14 · Vercel)                │
│  ──────────────────────────────────────────────────────────    │
│  pages/api/detector/[...path].ts  → proxy a HF Space           │
│  pages/api/{upload, generate-faqs, faqs, ...}  → flujo local   │
│                                                                │
│  Páginas:                                                      │
│   /dashboard    → métricas + gráficas SVG del detector         │
│   /suggestions  → revisar sugerencias del detector (aprobar/   │
│                   rechazar individual o en lote)               │
│   /upload       → subir CSV/JSON/TXT                           │
│   /files/[id]   → ver archivo + FAQs derivadas (Gemini)        │
│   /evaluation   → métricas agregadas de las FAQs locales       │
└────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ (3) approve → dual-write
┌────────────────────────────────────────────────────────────────┐
│  SUPABASE LOCAL del frontend                                   │
│  files · faqs (consumida por el bot oficial de Everwod)        │
└────────────────────────────────────────────────────────────────┘
```

## Pipelines de generación de FAQs

### A) Pipeline del detector (HF Space) — fuente principal

| Etapa | Tecnología |
|---|---|
| Lectura | SQLAlchemy → Supabase Pooler (BD producción Everwod) |
| Limpieza | Filtros de ruido (saludos, "ok", "gracias"), normalización |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Clustering | HDBSCAN sobre vectores L2-normalizados |
| Dedupe | Cosine similarity ≥ 0.85 vs FAQs existentes |
| Síntesis | `Qwen/Qwen2.5-72B-Instruct` vía `huggingface_hub.InferenceClient` |
| Persistencia | Tablas `faq_suggestions` + `pipeline_runs` (audit) |
| Scheduler | APScheduler — cron diario 3am (configurable) |

Disparable manualmente desde el frontend (`POST /pipeline/run` con `Idempotency-Key`) o automáticamente por el cron.

### B) Pipeline local de archivos — flujo secundario

| Etapa | Tecnología |
|---|---|
| Upload | `pages/api/upload.ts` → Supabase Storage (bucket `files`) + tabla `files` |
| Disparo | `POST /api/generate-faqs` con `fileId` |
| Clustering | TF-IDF local (`lib/nlp/embeddings.ts → simpleCluster`) — sin embeddings externos |
| Síntesis | **Google Gemini 3.5 Flash** (`@google/generative-ai`) |
| Persistencia | Inserta en tabla `faqs` con `file_id` y `status=pending` |
| Trigger automático | Vercel Cron `/api/cron/process-pending` cada 24h |

> **Nota**: `lib/anthropic.ts` está declarado pero **actualmente no se invoca** desde ningún endpoint. Es código muerto que podría eliminarse o reactivarse si se decide mover el flujo local a Claude.

## Flujo de revisión y aprobación

Tanto las sugerencias del detector como las FAQs locales llegan a la misma cola de revisión humana, pero por rutas distintas:

```
Sugerencia HF detector (status: pending en BD detector)
      │
      │  Admin entra a /suggestions y aprueba
      ▼
useSuggestionActions.approve  ó  useBulkSuggestionActions
      │
      ├─► (a) POST /api/v1/suggestions/{id}/approve     (audit en HF)
      └─► (b) POST /api/faqs  → INSERT en tabla `faqs` local
              source: 'ai_detector', metadata: { suggestion_id, reviewer }
                  │
                  ▼
            La FAQ queda disponible para el bot de WhatsApp
```

```
FAQ derivada de archivo subido (status: pending en tabla `faqs` local)
      │
      │  Admin entra a /files/[id]/faqs
      ▼
PATCH /api/faqs/{id}  con status: approved | edited | rejected
                  │
                  ▼
            La FAQ queda disponible para el bot de WhatsApp
```

## Componentes técnicos del frontend

- **Framework**: Next.js 14 (App Router para `/app/*` + Pages API para `/pages/api/*`)
- **Tipos**: TypeScript estricto, contratos del detector en `lib/detector/types.ts` (alineados 1:1 con los Pydantic schemas del backend)
- **Cliente HTTP**: `lib/detector/client.ts` apunta siempre al proxy `/api/detector/*` para evitar CORS y ocultar la API key
- **Real-time**: `EventSource` consume el SSE del pipeline (`/api/detector/pipeline/runs/{id}/stream`); el proxy hace pass-through del `text/event-stream`
- **Idempotencia**: `Idempotency-Key` (UUID v4) en todo `POST /pipeline/run` para evitar doble-disparo
- **Auth de usuario**: Supabase Auth (sesión JWT en cookie/localStorage)
- **Animaciones**: Framer Motion + GSAP + Lenis (scroll)
- **3D**: Three.js / React-Three-Fiber en el hero

## Gráficas y visualización

Todas las gráficas son **SVG nativo + Framer Motion**, sin librerías externas:

| Componente | Datos del backend |
|---|---|
| `StatusDonut` | `metrics.overview.{pending, approved, rejected, edited}` |
| `CategoryBars` | `metrics.by_category[]` (color = `approval_rate`) |
| `WorkspaceBars` | `metrics.by_workspace[]` (apilado apr/pend/rech) |
| `PipelineTimeline` | `runs[]` bucketizados por día (últimos 14) |
| `WorkspaceDetailCard` | `GET /workspaces/{id}` (top categorías + breakdown + last run) |

## Seguridad y operación

- **Frontend → HF**: `X-API-Key` enviada **server-side** desde el proxy (`pages/api/detector/[...path].ts`). Nunca expuesta al cliente.
- **Frontend → Supabase local**: clave `service_role` solo en endpoints de servidor; clave `anon` en el cliente.
- **Validación de uploads**: extensión + tamaño + magic bytes en `pages/api/upload.ts`.
- **CORS**: el backend HF restringe orígenes a los dominios de Vercel.
- **Rate limiting**: en el backend HF (slowapi) por IP + workspace.
- **Health check**: badge en el header (`useDetectorHealth`) hace polling cada 60s al `/health` del detector y muestra estado en tiempo real (DB, scheduler, HF Inference).

## Variables de entorno

### Frontend (`.env.local`)

```env
# Supabase local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA local (file upload flow)
GEMINI_API_KEY=

# Detector HF Space
DETECTOR_URL=https://dulceychon-everwod-faq-detector.hf.space
DETECTOR_API_KEY=                    # debe coincidir con API_KEY del backend

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend HF (`.env` en el Space)

```env
DATABASE_URL=                         # Supabase Session Pooler de Everwod prod
API_KEY=                              # misma que DETECTOR_API_KEY del frontend
HF_TOKEN=                             # para invocar Qwen-72B vía Inference
SCHEDULER_ENABLED=true
CORS_ORIGINS=https://<vercel-app>.vercel.app
```

## Evaluación experimental

El sistema mide su propio desempeño mediante:

- **Precisión** = `approved / (approved + rejected)` por categoría
- **Calidad del clustering** = `avg_silhouette_score` expuesto en `metrics.pipeline`
- **Confianza del sintetizador** = `avg_confidence_score` en `metrics.overview`
- **Cobertura temporal** = `trends.suggestions_last_{7,30}_days`
- **Dedupe efectivo** = `suggestions_skipped` por corrida (clusters ya cubiertos por una FAQ existente)
