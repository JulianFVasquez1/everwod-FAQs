import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

// Regex para validar UUID v4
const UUID_REGEX = /^[0-9a-f-]{36}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo se permiten peticiones GET' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autorizado' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error in files/[id]:", authError);
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido', details: authError?.message });
    }

    const { id } = req.query;

    // Validar que el id existe y es un string con formato UUID
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'El ID proporcionado no es un UUID válido' });
    }

    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Código de error PGRST116 en Supabase significa "no rows returned" al usar .single()
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'No se encontró el archivo con el ID proporcionado' });
      }
      
      console.error('Error consultando registro en Supabase:', error);
      return res.status(500).json({ error: 'QUERY_FAILED', message: 'Falló la consulta a la base de datos' });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error en el endpoint de consulta por ID:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor' });
  }
}
