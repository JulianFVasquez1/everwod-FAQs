# Arquitectura del Sistema: Everwod FAQ Cloud

## Visión General
El sistema está diseñado para la detección automática de patrones conversacionales y la optimización de agentes de IA mediante el análisis semántico de datos históricos.

## Flujo de Datos (Data Pipeline)

1. **Ingesta:** El usuario sube archivos (CSV, JSON, TXT) a través de una interfaz Next.js. Los archivos se almacenan en **Supabase Storage**.
2. **Procesamiento NLP (Clustering & Embeddings):**
   - El contenido se divide en fragmentos (chunks).
   - Se generan **Embeddings** para cada fragmento usando el modelo `text-embedding-004` de Google.
   - Se aplica un algoritmo de **Clustering** por similitud de coseno para agrupar temas recurrentes.
3. **Generación de FAQs:** Los clusters detectados se envían a **Gemini 1.5 Flash**, que redacta una pregunta y respuesta profesional basada en los mensajes reales del grupo.
4. **Validación:** Un agente humano revisa las sugerencias en un panel interactivo antes de que sean integradas al conocimiento del bot oficial.

## Componentes Técnicos

- **Frontend:** Next.js 14, Framer Motion, GSAP, Tailwind CSS.
- **Backend:** Next.js API Routes (Serverless Functions).
- **IA/ML:** 
  - Embeddings: Google Generative AI (`text-embedding-004`).
  - LLM: Google Gemini (`gemini-1.5-flash`).
- **Base de Datos:** Supabase (PostgreSQL).
- **Automatización:** Vercel Crons para procesamiento programado periódico.

## Evaluación Experimental
El sistema evalúa su propio desempeño mediante:
- **Precisión:** Calculada como el ratio de FAQs aprobadas/editadas vs rechazadas.
- **Reducción de Ambigüedad:** Evaluación de la densidad de los clusters semánticos.
- **Escalabilidad:** Procesamiento de archivos en lotes para manejar grandes volúmenes de conversaciones de WhatsApp.

## Consideraciones de Seguridad
- Autenticación mediante Supabase Auth.
- Validación estricta de tipos de archivos y tamaños en el lado del servidor.
- Protección de variables de entorno mediante Vercel Secrets.
