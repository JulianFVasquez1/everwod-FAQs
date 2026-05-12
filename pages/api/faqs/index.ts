import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo GET permitido' });
  }

  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'INVALID_ID', message: 'fileId es requerido' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
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
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}
