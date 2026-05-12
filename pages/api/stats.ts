import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo GET permitido' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    console.error("Auth error:", authError);
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido', details: authError?.message });
  }

  try {
    // 1. Files metrics
    const { data: filesCountData, error: filesError } = await supabaseAdmin
      .from('files')
      .select('status', { count: 'exact' });

    if (filesError) throw filesError;

    const totalFiles = filesCountData?.length || 0;
    const pending = filesCountData?.filter(f => f.status === 'uploaded').length || 0;
    const processed = filesCountData?.filter(f => f.status === 'processed').length || 0;
    const errors = filesCountData?.filter(f => f.status === 'error').length || 0;

    // 2. FAQs metrics
    let faqsGenerated = 0;
    let faqsApproved = 0;

    const { data: faqsCountData, error: faqsError } = await supabaseAdmin
      .from('faqs')
      .select('status', { count: 'exact' });

    if (!faqsError && faqsCountData) {
      faqsGenerated = faqsCountData.length;
      faqsApproved = faqsCountData.filter(f => f.status === 'approved').length;
    } else if (faqsError && faqsError.code !== '42P01' && faqsError.code !== 'PGRST205') {
      // 42P01 / PGRST205 = relation does not exist (tabla no creada)
      throw faqsError;
    }

    return res.status(200).json({
      totalFiles,
      pending,
      processed,
      errors,
      faqsGenerated,
      faqsApproved
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}
