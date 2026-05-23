import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, verifyToken } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'INVALID_ID', message: 'ID es requerido' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  const { user, error: authError } = await verifyToken(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const { error } = await supabaseAdmin.from('faqs').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error: 'UPDATE_FAILED', message: error.message });
    return res.status(200).json({ success: true });
  } else if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('faqs').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'DELETE_FAILED', message: error.message });
    return res.status(200).json({ success: true });
  } else {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Método no permitido' });
  }
}
