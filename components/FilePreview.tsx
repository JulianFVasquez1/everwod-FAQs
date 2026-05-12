'use client';

import React, { useState } from 'react';

type PreviewData = {
  type: string;
  lines?: string[];
  data?: any;
};

export default function FilePreview({ fileId, type }: { fileId: string; type: string }) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const fetchPreview = async () => {
    if (preview) {
      setShow(!show);
      return;
    }
    
    setLoading(true);
    setError(null);
    setShow(true);
    
    try {
      const res = await fetch(`/api/preview?id=${fileId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener la vista previa');
      }
      
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-[#FFB800]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#F87171]/10 p-4 rounded-xl text-[#F87171] border border-[#F87171]/20">
          {error}
        </div>
      );
    }

    if (!preview) return null;

    if (preview.type === 'csv' && preview.lines) {
      if (preview.lines.length === 0) return <p className="text-white/40">Archivo vacío.</p>;
      const headers = preview.lines[0].split(',');
      const rows = preview.lines.slice(1).map(l => l.split(','));
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr>
                {headers.map((h, i) => <th key={i} className="px-4 py-2 text-left font-bold text-white/60">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j} className="px-4 py-2 text-white/80">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (preview.type === 'json' && preview.data) {
      return (
        <pre className="text-sm text-white/80 overflow-x-auto p-4 bg-black/30 rounded-xl">
          {JSON.stringify(preview.data, null, 2)}
        </pre>
      );
    }

    if (preview.type === 'txt' && preview.lines) {
      return (
        <ol className="list-decimal list-inside text-sm text-white/80 space-y-1 font-mono">
          {preview.lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      );
    }

    return <p className="text-white/40">No se pudo generar vista previa.</p>;
  };

  return (
    <div className="mt-8">
      <button 
        onClick={fetchPreview}
        className="mb-4 inline-flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        <svg className="w-4 h-4 mr-2 text-[#FFB800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {show ? 'Ocultar vista previa' : 'Ver vista previa'}
      </button>

      {show && (
        <div className="bg-[#1a1d27] rounded-2xl border border-white/10 p-6 shadow-inner">
          <h4 className="text-lg font-bold text-white mb-4">Vista Previa ({type.toUpperCase()})</h4>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
