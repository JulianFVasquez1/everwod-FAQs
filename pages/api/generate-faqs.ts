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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error in generate-faqs:", authError);
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido', details: authError?.message });
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
      return res.status(400).json({ error: 'ALREADY_GENERATED', message: 'Las FAQs ya fueron generadas para este archivo' });
    }

    // Descargar contenido
    const fileRes = await fetch(file.storage_url);
    if (!fileRes.ok) {
      return res.status(500).json({ error: 'FETCH_ERROR', message: 'No se pudo descargar el archivo para analizarlo' });
    }
    const content = await fileRes.text();

    // Llamar a Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const prompt = `Eres un asistente de análisis de conversaciones para Everwod.
Analiza las siguientes conversaciones y genera entre 5 y 10 preguntas
frecuentes (FAQs) con sus respuestas sugeridas.
Responde SOLO con un array JSON con este formato exacto, sin texto adicional:
[{ "question": "...", "answer": "..." }]
Conversaciones: ${content.substring(0, 100000)}`;

    let aiText = '';
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch (e: any) {
      if (e.status === 503 || e.message?.includes('503') || e.message?.includes('Service Unavailable')) {
        console.warn('gemini-2.5-flash unavailable (503), falling back to gemini-2.0-flash');
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        aiText = fallbackResult.response.text();
      } else {
        throw e;
      }
    }
    
    // Parsear JSON (limpiar markdown si viene)
    const jsonStr = aiText.replace(/```json\n?/, '').replace(/```\n?/, '');
    const faqs = JSON.parse(jsonStr);

    if (!Array.isArray(faqs)) {
      throw new Error('La IA no devolvió un array válido');
    }

    // Insertar en la BD
    const faqsToInsert = faqs.map(faq => ({
      file_id: fileId,
      question: faq.question,
      answer: faq.answer,
      status: 'pending'
    }));

    const { error: insertError } = await supabaseAdmin.from('faqs').insert(faqsToInsert);
    if (insertError) throw insertError;

    // Actualizar estado del archivo
    await supabaseAdmin.from('files').update({ faq_generated: true }).eq('id', fileId);

    return res.status(200).json({ success: true, count: faqsToInsert.length });
  } catch (error: any) {
    console.error('Error generating FAQs:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message || 'Error al generar FAQs' });
  }
}
