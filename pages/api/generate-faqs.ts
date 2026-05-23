/*
-- CREATE TABLE faqs (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   file_id uuid REFERENCES files(id) ON DELETE CASCADE,
--   question text NOT NULL,
--   answer text,
--   status text DEFAULT 'pending' CHECK (status IN ('pending','approved','edited','rejected')),
--   created_at timestamptz DEFAULT now()
-- );
*/

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEmbedding, simpleCluster } from '../../lib/nlp/embeddings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo POST permitido' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token requerido' });
    }
    const token = authHeader.replace('Bearer ', '');

    // Crear cliente temporal con la anon key para verificar el token del usuario
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
    }


    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'MISSING_FILE_ID', message: 'fileId es requerido' });
    }

    // Buscar archivo
    const { data: file, error: fileError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Archivo no encontrado' });
    }

    if (file.faq_generated) {
      return res.status(400).json({ error: 'ALREADY_GENERATED', message: 'Las FAQs ya fueron generadas' });
    }

    // Descargar contenido
    const fileRes = await fetch(file.storage_url);
    const content = await fileRes.text();

    // --- PIPELINE DE CLUSTERING ---
    // Dividir en líneas o párrafos significativos
    const chunks = content.split('\n').filter(line => line.trim().length > 20).slice(0, 50); // Límite para demo
    
    const clusters = simpleCluster(chunks, [], 0.15); // TF-IDF local, no requiere embeddings externos

    // Seleccionar los clusters más grandes o representativos
    const clusterSummary = clusters
      .sort((a, b) => b.length - a.length)
      .slice(0, 10)
      .map((c, i) => `Patrón ${i+1} (${c.length} menciones):\n${c.join('\n')}`)
      .join('\n\n');

    // --- GENERACIÓN CON IA ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" }, { apiVersion: "v1" });
    
    // Configuramos mayor temperatura para que la redacción sea más natural
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    };
    
    const prompt = `Eres un experto en análisis de patrones conversacionales para Everwod.
He agrupado las conversaciones en clusters semánticos. 
Analiza los siguientes patrones detectados y genera una FAQ (pregunta y respuesta) refinada por cada patrón.
La respuesta debe ser clara, profesional y servicial.

Responde SOLO con un array JSON (formato: [{ "question": "...", "answer": "..." }]).

PATRONES DETECTADOS:
${clusterSummary}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });
    const aiText = result.response.text();
    
    // Limpieza y parseo
    const jsonStr = aiText.replace(/```json\n?/, '').replace(/```\n?/, '');
    const faqs = JSON.parse(jsonStr);

    // Insertar FAQs
    const faqsToInsert = faqs.map((faq: { question: string; answer: string }) => ({
      file_id: fileId,
      question: faq.question,
      answer: faq.answer,
      status: 'pending'
    }));

    await supabaseAdmin.from('faqs').insert(faqsToInsert);
    await supabaseAdmin.from('files').update({ faq_generated: true }).eq('id', fileId);

    return res.status(200).json({ success: true, count: faqsToInsert.length });

  } catch (error: unknown) {
    console.error('Error in generate-faqs:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'INTERNAL_ERROR', message });
  }
}

