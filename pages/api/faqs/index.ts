import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, verifyToken } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  const { user, error: authError } = await verifyToken(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
  }

  // --- TRATAMIENTO DE PETICIONES GET (LISTADO) ---
  if (req.method === 'GET') {
    const { fileId } = req.query;

    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ error: 'INVALID_ID', message: 'fileId es requerido' });
    }

    try {
      const { data: faqs, error } = await supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'QUERY_FAILED', message: error.message });
      }

      const counts = {
        pending: faqs.filter(f => f.status === 'pending').length,
        approved: faqs.filter(f => f.status === 'approved').length,
        edited: faqs.filter(f => f.status === 'edited').length,
        rejected: faqs.filter(f => f.status === 'rejected').length,
      };

      return res.status(200).json({ faqs, counts });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // --- TRATAMIENTO DE PETICIONES POST (CREACIÓN DESDE DETECTOR) ---
  if (req.method === 'POST') {
    const { question, answer, status, file_id } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'MISSING_DATA', message: 'Pregunta y respuesta son requeridas' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('faqs')
        .insert({
          question,
          answer,
          status: status || 'pending',
          file_id: file_id || null, // Las del detector pueden no tener file_id
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'INSERT_FAILED', message: error.message });
      }

      return res.status(201).json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Método no permitido' });
}
