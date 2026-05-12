# Everwod FAQ Cloud

Plataforma integral para cargar conversaciones históricas (ej. de WhatsApp, chat de soporte), almacenarlas de forma segura en la nube y generar sugerencias automáticas de Preguntas Frecuentes (FAQs) para Everwod mediante IA.

## Stack Tecnológico
- **Frontend/Backend:** Next.js 14 (App Router & Pages API)
- **Base de Datos y Almacenamiento:** Supabase (PostgreSQL + Storage)
- **Lenguaje:** TypeScript
- **IA:** Anthropic Claude (claude-3-5-sonnet-20240620 o similar)
- **Despliegue:** Vercel

## Arquitectura

El sistema permite subir archivos CSV, JSON o TXT. El backend valida los archivos, los sube a Supabase Storage y registra los metadatos y categorías en la base de datos PostgreSQL. Posteriormente, se procesan usando la API de Anthropic para generar FAQs sugeridas que un agente humano puede aprobar, editar o rechazar.

### Flujo de Carga de Archivos
```text
[ Usuario ] -> (Sube Archivo UI)
                  |
                  v
[ Next.js API ] -> 1. Valida extensión, tamaño, magic bytes.
                  2. Sube a Supabase Storage (bucket "files").
                  3. Analiza contenido (Clasificación por palabras clave).
                  4. Inserta metadatos en Supabase DB.
                  |
                  v
[ Supabase ] <---- Almacenamiento & Registro Completo
```

## Pantallas Principales
<!-- screenshot: upload -->
<!-- screenshot: dashboard -->
<!-- screenshot: faqs_panel -->

## Variables de Entorno Necesarias

Crea un archivo `.env.local` en la raíz del proyecto basado en `.env.local.example` (nunca subas tus credenciales reales):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# IA (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
```

## Cómo Correr Localmente

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno en `.env.local`.
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue

La aplicación está diseñada para ser desplegada en Vercel. Sigue estos pasos:

1. Crea un nuevo proyecto en Vercel y enlaza este repositorio de GitHub.
2. Configura las variables de entorno en Vercel. Necesitarás las mismas que definiste en `.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Asegúrate de ejecutar las migraciones SQL en el editor SQL de Supabase antes del primer deploy (tabla `files`, `faqs`, etc).
4. Despliega la aplicación (el comando `vercel --prod` también se puede usar en CLI).

> **URL de despliegue:** Pendiente de confirmar tras el despliegue en Vercel.
