export const ALLOWED_TYPES = ['csv', 'json', 'txt'] as const;
export type AllowedType = typeof ALLOWED_TYPES[number];

export const ALLOWED_MIMES: Record<AllowedType, string[]> = {
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
  json: ['application/json'],
  txt: ['text/plain'],
};

export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Extrae la extensión de un nombre de archivo
 */
export function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1 || (parts[0] === '' && parts.length === 2)) {
    return ''; // Sin extensión o archivo oculto como .env
  }
  return parts.pop()!.toLowerCase();
}

/**
 * Verifica si una extensión está dentro de la lista de permitidas
 */
export function isAllowedExtension(extension: string): extension is AllowedType {
  return ALLOWED_TYPES.includes(extension as AllowedType);
}

/**
 * Verifica si el MIME type coincide con el tipo de extensión esperada
 */
export function isAllowedMime(mimeType: string, extension: AllowedType): boolean {
  const allowedMimesForExt = ALLOWED_MIMES[extension];
  return allowedMimesForExt ? allowedMimesForExt.includes(mimeType) : false;
}
