'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatBytes } from '../../../lib/utils';
import { FileRecord } from '../../../lib/types';
import StatusBadge from '../../../components/StatusBadge';
import FilePreview from '../../../components/FilePreview';
import AuthGuard from '../../../components/AuthGuard';
import { getSession } from '../../../lib/auth';

export default function FileDetailPage({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const session = await getSession();
        if (!session) {
          setError('No hay sesión activa.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/files/${params.id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (res.status === 404) {
          notFound();
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to fetch');
        }

        const data = await res.json();
        setFile(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Error de Conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-white">
        Cargando detalles del archivo...
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center bg-[#14161f] p-8 rounded-2xl shadow-sm border border-[#F87171]/20">
           <svg className="w-12 h-12 text-[#F87171] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <h2 className="text-xl font-bold text-white mb-2">Error de Conexión</h2>
           <p className="text-[#F87171] mb-4">{error || 'No se pudo cargar el detalle del archivo.'}</p>
           <Link href="/files" className="text-white/60 hover:text-white transition-colors">Volver al listado</Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0f1117] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6">
          <Link href="/files" className="text-sm font-semibold text-white/60 hover:text-white flex items-center group w-max transition-colors">
            <svg className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Archivos
          </Link>
        </div>

        <div className="bg-[#14161f] shadow-md overflow-hidden sm:rounded-2xl border border-white/10">
          <div className="px-6 py-6 sm:px-8 flex justify-between items-start border-b border-white/5 bg-white/5">
            <div>
              <h3 className="text-xl leading-6 font-bold text-white">
                Detalle del Archivo
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-white/40">
                Información técnica y metadatos extraídos de Supabase.
              </p>
            </div>
            <StatusBadge status={file.status} />
          </div>
          
          <div className="px-6 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-white/5">
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">Nombre original</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-md w-fit">
                  {file.original_name}
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">Propietario</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex items-center">
                  <div className="w-6 h-6 bg-white/10 text-white rounded-full flex items-center justify-center font-bold text-xs mr-2">
                    {file.owner.charAt(0).toUpperCase()}
                  </div>
                  {file.owner} 
                  {file.group_name && <span className="ml-2 px-2 py-0.5 bg-white/10 text-white/60 rounded-full text-xs">{file.group_name}</span>}
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">Especificaciones</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex items-center gap-3">
                  <span className="uppercase font-bold text-xs bg-white/10 text-white px-2 py-1 rounded">{file.type}</span> 
                  <span className="text-white/40">{formatBytes(file.size_bytes)}</span>
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">Fecha de subida</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {new Date(file.uploaded_at).toLocaleString()}
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">ID Interno</dt>
                <dd className="mt-1 text-xs text-white/20 sm:mt-0 sm:col-span-2 font-mono break-all selection:bg-white/10">
                  {file.id}
                </dd>
              </div>
              {file.observations && (
                <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                  <dt className="text-sm font-semibold text-white/40">Observaciones</dt>
                  <dd className="mt-1 text-sm text-white/80 sm:mt-0 sm:col-span-2 italic border-l-2 border-[#FACC15]/50 pl-3">
                    "{file.observations}"
                  </dd>
                </div>
              )}
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40">Categorías Detectadas</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex flex-wrap gap-2">
                  {file.categories && file.categories.length > 0 ? (
                    file.categories.map((cat: string) => (
                      <span key={cat} className="px-2 py-1 bg-[#FACC15]/10 text-[#FFB800] border border-[#FACC15]/20 rounded-md text-xs font-bold uppercase tracking-wider">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/40 italic">Ninguna</span>
                  )}
                </dd>
              </div>
              <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-white/5 transition-colors">
                <dt className="text-sm font-semibold text-white/40 flex items-center">Procesamiento FAQ</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-6">
                    <span className="flex items-center font-medium">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${file.faq_generated ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`}></div>
                      Generado: <span className="ml-1 text-white/60">{file.faq_generated ? 'Sí' : 'No'}</span>
                    </span>
                    <span className="flex items-center font-medium">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${file.faq_validated ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`}></div>
                      Validado: <span className="ml-1 text-white/60">{file.faq_validated ? 'Sí' : 'No'}</span>
                    </span>
                  </div>

                  {file.faq_generated ? (
                    <Link href={`/files/${file.id}/faqs`} className="inline-flex items-center px-4 py-2 bg-[#FACC15]/10 text-[#FFB800] hover:bg-[#FACC15]/20 border border-[#FACC15]/20 rounded-lg text-sm font-bold transition-colors">
                      Ver FAQs
                    </Link>
                  ) : (
                    <Link href={`/files/${file.id}/faqs`} className="inline-flex items-center px-4 py-2 bg-[#FACC15] text-black hover:bg-[#eab308] shadow-[0_0_10px_rgba(250,204,21,0.2)] rounded-lg text-sm font-bold transition-all">
                      Generar FAQs
                    </Link>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="px-6 py-5 sm:p-0 border-t border-white/5">
            <div className="px-8 pb-6">
              <FilePreview fileId={file.id} type={file.type} />
            </div>
          </div>
          
          <div className="bg-[#0f1117]/50 px-6 py-5 sm:px-8 flex justify-end border-t border-white/5">
            <a
              href={file.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-[260px] h-[44px] cursor-pointer flex items-center border border-[#eab308] bg-[#FACC15] overflow-hidden rounded-xl transition-all duration-300 hover:bg-[#eab308] active:border-[#ca8a04] shadow-[0_0_15px_rgba(250,204,21,0.15)] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            >
              <span className="transform translate-x-[20px] text-black font-bold text-sm transition-all duration-300 group-hover:text-transparent">
                Descargar Archivo Original
              </span>
              <span className="absolute transform translate-x-[218px] h-full w-[40px] bg-[#eab308] flex items-center justify-center transition-all duration-300 group-hover:w-[258px] group-hover:translate-x-0 group-active:bg-[#ca8a04]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" id="bdd05811-e15d-428c-bb53-8661459f9307" data-name="Layer 2" className="w-[20px] fill-black"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
