import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

/**
 * Endpoint de prueba para procesamiento automático.
 * En producción se protegería con un CRON_SECRET.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simulación de protección por secreto (Vercel Cron)
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401)...

  try {
    // Buscar archivos pendientes de procesar
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('faq_generated', false)
      .limit(3); // Procesar de a pocos para evitar timeouts

    if (error) throw error;

    if (!files || files.length === 0) {
      return res.status(200).json({ message: 'No hay archivos pendientes.' });
    }

    const results = [];
    for (const file of files) {
      // Llamar internamente a la lógica de generación
      // En un entorno Vercel, podríamos usar una cola o llamar al endpoint absoluto
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const response = await fetch(`${appUrl}/api/generate-faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Nota: Aquí se requeriría un bypass de auth o un token de sistema
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` 
        },
        body: JSON.stringify({ fileId: file.id })
      });

      results.push({ id: file.id, status: response.status });
    }

    return res.status(200).json({ processed: results });
  } catch (error: unknown) {
    console.error('Cron Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
