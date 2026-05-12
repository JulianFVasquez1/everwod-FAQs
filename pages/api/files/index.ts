import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo se permiten peticiones GET' });
  }

  try {
    const { owner, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    let limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'INVALID_PAGE', message: 'El parámetro page debe ser un número entero positivo' });
    }
    
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'INVALID_LIMIT', message: 'El parámetro limit debe ser un número entero positivo' });
    }

    if (limitNum > 100) {
      limitNum = 100;
    }

    // Calcular la paginación para .range(from, to) de Supabase
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    // Construir la consulta principal
    let query = supabaseAdmin
      .from('files')
      .select('*', { count: 'exact' }) // Para obtener el count total de filas
      .order('uploaded_at', { ascending: false })
      .range(from, to);

    // Filtros opcionales
    if (owner && typeof owner === 'string') {
      query = query.eq('owner', owner);
    }

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Ejecutar la consulta
    const { data, count, error } = await query;

    if (error) {
      console.error('Error consultando Supabase:', error);
      return res.status(500).json({ error: 'QUERY_FAILED', message: 'No se pudieron obtener los archivos de la base de datos' });
    }

    return res.status(200).json({ data, count });

  } catch (error) {
    console.error('Error en el endpoint de listado:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor' });
  }
}
