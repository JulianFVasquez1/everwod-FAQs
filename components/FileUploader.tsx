'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import UploadAnimation from './ui/UploadAnimation';

// Constantes para validación en cliente
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['csv', 'json', 'txt'];

type UploadState = {
  status: 'idle' | 'validating' | 'uploading' | 'success' | 'error';
  message: string;
  fileId?: string;
};

export default function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del formulario
  const [group, setGroup] = useState('');
  const [observations, setObservations] = useState('');

  // Estado de la subida
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
  });

  const getExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validaciones del lado del cliente
    setUploadState({ status: 'validating', message: 'Validando archivo...' });

    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setUploadState({ status: 'error', message: 'Por favor selecciona un archivo.' });
      return;
    }

    const extension = getExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadState({
        status: 'error',
        message: `Tipo de archivo inválido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setUploadState({ status: 'error', message: 'El archivo excede el tamaño máximo permitido de 10MB.' });
      return;
    }

    // 2. Preparar los datos con FormData
    setUploadState({ status: 'uploading', message: 'Subiendo archivo y procesando metadatos...' });

    const formData = new FormData();
    formData.append('file', file);

    if (group.trim()) formData.append('group', group.trim());
    if (observations.trim()) formData.append('observations', observations.trim());

    // 3. Enviar a la API /api/upload
    try {
      const { getSession } = await import('../lib/auth');
      const session = await getSession();
      if (!session) {
        throw new Error('Debes iniciar sesión para subir archivos');
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // En caso de error, mostramos el código de error devuelto por la API
        throw new Error(`[${data.error || 'UPLOAD_FAILED'}] ${data.message || 'Error desconocido al subir el archivo'}`);
      }

      // 4. Éxito
      setUploadState({
        status: 'success',
        message: '¡Archivo subido y registrado con éxito!',
        fileId: data.id,
      });

      // Limpiamos el formulario en caso de éxito
      setGroup('');
      setObservations('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: unknown) {
      // 5. Error
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Ocurrió un error de conexión',
      });
    }
  };

  const isProcessing = uploadState.status === 'validating' || uploadState.status === 'uploading';

  return (
    <>
      <UploadAnimation
        active={uploadState.status === 'uploading' || uploadState.status === 'success'}
        phase={uploadState.status === 'uploading' ? 'uploading' : 'success'}
      />
      <div className="w-full max-w-2xl mx-auto p-8 glass">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary">Subir Documento Base</h2>
          <p className="text-sm text-secondary mt-1">
            Añade un nuevo archivo de texto para alimentar la base de conocimiento FAQ.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">

          {/* Group Field */}
          <div>
            <label htmlFor="group" className="block text-sm font-semibold text-secondary mb-1">
              Grupo <span className="text-secondary/50 font-normal">(Opcional)</span>
            </label>
            <input
              id="group"
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-white/5 border border-card-border rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] text-primary placeholder-secondary/30 outline-none transition-all text-sm"
              placeholder="Ej. equipo-soporte"
            />
          </div>

          {/* File Input */}
          <div>
            <label htmlFor="file" className="block text-sm font-semibold text-secondary mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-card-border border-dashed rounded-xl bg-white/5 hover:bg-white/10 transition-colors group/upload">
              <div className="space-y-2 text-center">
                <svg className="mx-auto h-12 w-12 text-secondary/30 transition-transform group-hover/upload:scale-110" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-secondary/60 justify-center">
                  <label htmlFor="file" className="relative cursor-pointer bg-transparent rounded-md font-bold text-[#FFB800] hover:text-[#FFB800]-hover focus-within:outline-none transition-colors">
                    <span>Sube un archivo</span>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,.json,.txt"
                      disabled={isProcessing}
                      required
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1 text-secondary/40">o arrástralo y suéltalo</p>
                </div>
                <p className="text-xs text-secondary/30">CSV, JSON, TXT hasta 10MB</p>
              </div>
            </div>
          </div>

          {/* Observations Field */}
          <div>
            <label htmlFor="observations" className="block text-sm font-semibold text-secondary mb-1">
              Observaciones <span className="text-secondary/50 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="observations"
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-white/5 border border-card-border rounded-xl focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] text-primary placeholder-secondary/30 outline-none transition-all resize-none text-sm"
              placeholder="Añade notas sobre el contenido, fechas, o contexto de este archivo..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] text-sm font-bold text-black transition-all
            ${isProcessing ? 'bg-[#FACC15]/50 cursor-wait text-black/50' : 'premium-gradient hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {uploadState.message}
              </>
            ) : 'Subir Archivo'}
          </button>

          {/* Status Messages */}
          {uploadState.status === 'error' && (
            <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 flex shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#F87171]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[#F87171]">{uploadState.message}</p>
              </div>
            </div>
          )}

          {uploadState.status === 'success' && (
            <div className="p-5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-[#34D399]/20 rounded-full p-1">
                    <svg className="h-5 w-5 text-[#34D399]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-[#34D399]">{uploadState.message}</p>
                </div>
              </div>
              {uploadState.fileId && (
                <div className="ml-10">
                  <Link
                    href={`/files/${uploadState.fileId}`}
                    className="inline-flex items-center text-sm text-[#34D399] font-medium hover:text-[#10b981] group"
                  >
                    Ir al panel del archivo
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
              )}
            </div>
          )}

        </form>
      </div>
    </>
  );
}
