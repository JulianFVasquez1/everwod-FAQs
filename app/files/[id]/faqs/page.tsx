'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

import AuthGuard from '../../../../components/AuthGuard';
import { getSession } from '../../../../lib/auth';
import { FAQRecord } from '../../../../lib/types';

export default function FileFAQsPage({ params }: { params: { id: string } }) {
  const fileId = params.id;


  const [faqs, setFaqs] = useState<FAQRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, edited: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [faqGenerated, setFaqGenerated] = useState(true); // Assume true initially

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const token = session.access_token;

      // Check if file has FAQs generated
      const fileRes = await fetch(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fileRes.ok) {
        const file = await fileRes.json();
        setFaqGenerated(file.faq_generated);
      }

      const res = await fetch(`/api/faqs?fileId=${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
        setCounts(data.counts || { pending: 0, approved: 0, edited: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const session = await getSession();
      if (!session) return;
      
      const res = await fetch('/api/generate-faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ fileId })
      });
      
      if (res.ok) {
        setFaqGenerated(true);
        await fetchFaqs();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error generating FAQs', error);
      alert('Error de conexión al generar FAQs');
    } finally {
      setGenerating(false);
    }
  };

  const updateFaqStatus = async (id: string, status: string, question?: string, answer?: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      
      const body: Record<string, string> = { status };
      if (question) body.question = question;
      if (answer) body.answer = answer;

      const res = await fetch(`/api/faqs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setEditingId(null);
        await fetchFaqs();
      }
    } catch (error) {
      console.error('Error updating FAQ', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-bold uppercase tracking-wider">Pendiente</span>;
      case 'approved': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-bold uppercase tracking-wider">Aprobada</span>;
      case 'edited': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-bold uppercase tracking-wider">Editada</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-bold uppercase tracking-wider">Rechazada</span>;
      default: return null;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0f1117] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <Link href={`/files/${fileId}`} className="text-sm font-semibold text-white/60 hover:text-white flex items-center group transition-colors">
              <svg className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Detalle
            </Link>
            
            {!faqGenerated && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[#FACC15] hover:bg-[#eab308] text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(250,204,21,0.15)] transition-all disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar FAQs'}
              </button>
            )}
          </div>

          <div className="bg-[#14161f] shadow-md overflow-hidden sm:rounded-2xl border border-white/10">
            <div className="px-6 py-6 sm:px-8 border-b border-white/5 bg-white/5">
              <h3 className="text-xl leading-6 font-bold text-white">
                FAQs Sugeridas
              </h3>
              <p className="mt-2 text-sm text-white/40">
                {counts.pending} pendientes · {counts.approved} aprobadas · {counts.rejected} rechazadas
              </p>
            </div>
            
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-white/40">Cargando FAQs...</div>
              ) : faqs.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  {faqGenerated ? 'No se encontraron FAQs para este archivo.' : 'Las FAQs aún no han sido generadas.'}
                </div>
              ) : (
                faqs.map(faq => (
                  <div key={faq.id} className="p-6 sm:px-8 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(faq.status)}
                    </div>
                    
                    {editingId === faq.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Pregunta</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#FACC15]" 
                            value={editQuestion} 
                            onChange={(e) => setEditQuestion(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Respuesta</label>
                          <textarea 
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#FACC15] min-h-[100px]" 
                            value={editAnswer} 
                            onChange={(e) => setEditAnswer(e.target.value)} 
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateFaqStatus(faq.id, 'edited', editQuestion, editAnswer)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Guardar
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-lg font-bold text-white mb-2">{faq.question}</h4>
                        <p className="text-white/70 mb-6">{faq.answer}</p>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => updateFaqStatus(faq.id, 'approved')}
                            className="flex items-center px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-semibold transition-colors"
                          >
                            ✅ Aprobar
                          </button>
                          <button 
                            onClick={() => {
                              setEditingId(faq.id);
                              setEditQuestion(faq.question);
                              setEditAnswer(faq.answer);
                            }}
                            className="flex items-center px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-semibold transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => updateFaqStatus(faq.id, 'rejected')}
                            className="flex items-center px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors"
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
