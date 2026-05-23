/* 
-- ALTER TABLE files ADD COLUMN categories text[] DEFAULT '{}';
*/

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Fields, Files } from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fromFile } from 'file-type';

import { supabaseAdmin, verifyToken } from '../../lib/supabase';
import {
  ALLOWED_TYPES,
  AllowedType,
  MAX_SIZE_BYTES,
  getExtension,
  isAllowedExtension,
  isAllowedMime,
} from '../../lib/validators';

// Deshabilitamos el body parser de Next.js para poder usar formidable con multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

function classifyContent(text: string): string[] {
  const categories: string[] = [];
  const content = text.toLowerCase();
  
  if (/precio|costo|tarifa|valor|cobro|pago/.test(content)) categories.push('precios');
  if (/error|falla|problema|no funciona|ayuda|soporte/.test(content)) categories.push('soporte');
  if (/horario|hora|abierto|cierre|disponible|atención/.test(content)) categories.push('horarios');
  if (/cancelar|anular|devolver|reembolso|baja/.test(content)) categories.push('cancelaciones');
  if (/configurar|instalar|activar|cuenta|contraseña/.test(content)) categories.push('configuración');
  if (/agente|humano|persona|hablar con|asesor/.test(content)) categories.push('atención humana');
  
  if (categories.length === 0) categories.push('general');
  return categories;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Solo se permiten peticiones POST' });
  }

  const form = formidable({
    maxFileSize: MAX_SIZE_BYTES,
    keepExtensions: true,
  });

  let fileTempPath: string | null = null;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No se proporcionó token de autenticación' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { user, error: authError } = await verifyToken(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token de autenticación inválido o expirado' });
    }
    const owner = user.email || 'unknown@example.com';

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Formidable v3 retorna arreglos para los archivos por defecto
    const uploadedFiles = files.file as File[] | undefined;
    const file = uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles[0] : (files.file as unknown as File);

    if (!file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No se envió ningún archivo' });
    }

    fileTempPath = file.filepath;
    const originalName = file.originalFilename || 'unknown';
    const extension = getExtension(originalName);
    const mimeType = file.mimetype || '';
    const sizeBytes = file.size;

    // Validación adicional de Content-Type leyendo magic bytes
    const fileTypeResult = await fromFile(fileTempPath);
    const finalMime = fileTypeResult?.mime || mimeType;
    const finalExt = fileTypeResult?.ext || extension;

    // Parseamos los campos que pueden venir como arreglos
    const group = Array.isArray(fields.group) ? fields.group[0] : fields.group;
    const observations = Array.isArray(fields.observations) ? fields.observations[0] : fields.observations;

    // Validación 2: Tipo de archivo y MIME Type verificando con magic bytes
    if (!isAllowedExtension(finalExt) || !isAllowedMime(finalMime, finalExt as AllowedType)) {
      return res.status(400).json({
        error: 'INVALID_TYPE',
        message: `Tipo de archivo inválido. Permitidos: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    // Validación 3: Tamaño máximo (por si formidable falla en atraparlo o por doble seguridad)
    if (sizeBytes > MAX_SIZE_BYTES) {
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'El archivo excede el tamaño máximo permitido de 10MB' });
    }

    // 4. Renombrar archivo con UUID
    const uuid = uuidv4();
    const storagePath = `uploads/${uuid}-${originalName}`;
    const fileBuffer = fs.readFileSync(fileTempPath);
    
    // Extraer texto para clasificar
    const textContent = fileBuffer.toString('utf-8');
    const categories = classifyContent(textContent);

    try {
      // 5. Subir a Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(storagePath, fileBuffer, { contentType: finalMime, upsert: false });

      if (uploadError) {
        console.error('Error subiendo a Supabase Storage:', uploadError);
        return res.status(500).json({ error: 'STORAGE_UPLOAD_FAILED', message: uploadError.message });
      }

      // 6. Construir URL de almacenamiento
      const { data: urlData } = supabaseAdmin.storage.from('files').getPublicUrl(storagePath);
      const storageUrl = urlData.publicUrl;

      // 7. Insertar en base de datos Supabase
      const { data: insertedData, error: supabaseError } = await supabaseAdmin
        .from('files')
        .insert({
          name: `${uuid}-${originalName}`,
          original_name: originalName,
          type: finalExt,
          size_bytes: sizeBytes,
          owner,
          group_name: group || null,
          status: 'uploaded',
          storage_url: storageUrl,
          storage_path: storagePath,
          observations: observations || null,
          categories: categories,
        })
        .select()
        .single();

      if (supabaseError) {
        console.error('Error insertando en Supabase:', supabaseError);
        return res.status(500).json({ error: 'SUPABASE_INSERT_FAILED', message: `Detalle del error: ${supabaseError.message || supabaseError.details || 'Desconocido'}` });
      }

      // 9. Retornar éxito con la fila insertada
      return res.status(200).json(insertedData);
    } finally {
      // 8. Limpiar archivo temporal garantizado
      if (fileTempPath && fs.existsSync(fileTempPath)) {
        try {
          fs.unlinkSync(fileTempPath);
        } catch (unlinkError) {
          console.error('No se pudo borrar el archivo temporal:', unlinkError);
        }
      }
    }

  } catch (error: unknown) {
    console.error('Error en el endpoint de subida:', error);
    // Atrapamos un error en particular de formidable para límite de tamaño
    if (error instanceof Error && (error as { code?: number }).code === 1009) { 
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'El archivo excede el tamaño máximo permitido' });
    }
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor' });
  }
}
