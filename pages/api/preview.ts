import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo se permiten peticiones GET' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'INVALID_ID', message: 'ID es requerido' });
    }

    const { data: file, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Archivo no encontrado' });
    }

    if (!file.storage_url) {
      return res.status(400).json({ error: 'NO_URL', message: 'El archivo no tiene una URL pública' });
    }

    const fileRes = await fetch(file.storage_url);
    if (!fileRes.ok) {
      return res.status(500).json({ error: 'FETCH_ERROR', message: 'No se pudo descargar el archivo' });
    }

    const text = await fileRes.text();
    const type = file.type?.toLowerCase();

    if (type === 'csv') {
      const lines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 10);
      return res.status(200).json({ type: 'csv', lines });
    } else if (type === 'json') {
      try {
        const parsed = JSON.parse(text);
        let preview = parsed;
        if (Array.isArray(parsed)) {
          preview = parsed.slice(0, 5);
        } else if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed).slice(0, 5);
          preview = {};
          keys.forEach((k: string) => { (preview as any)[k] = parsed[k]; });
        }
        return res.status(200).json({ type: 'json', data: preview });
      } catch (e) {
        return res.status(400).json({ error: 'PARSE_ERROR', message: 'El contenido no es un JSON válido' });
      }
    } else if (type === 'txt') {
      const lines = text.split('\n').slice(0, 20);
      return res.status(200).json({ type: 'txt', lines });
    }

    return res.status(400).json({ error: 'UNSUPPORTED_TYPE', message: 'Tipo no soportado para vista previa' });
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor' });
  }
}
