'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { formatBytes } from '../../lib/utils';
import { FileRecord } from '../../lib/types';
import StatusBadge from '../../components/StatusBadge';
import AuthGuard from '../../components/AuthGuard';

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/files?limit=50', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Error al obtener la lista de archivos');
        return r.json();
      })
      .then((json) => setFiles(json.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);



  return (
    <AuthGuard>
      <div
        className="min-h-screen py-10 px-4 sm:px-6 lg:px-8"
        style={{ background: 'var(--bg-gradient)', color: 'var(--text-primary)' }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-between items-center mb-10"
          >
            <div>
              <h1
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Archivos Subidos
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Listado de todos los documentos indexados en el sistema.
              </p>
            </div>
            <Link
              href="/upload"
              className="premium-gradient px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(250,204,21,0.35)]"
            >
              + Subir Documento
            </Link>
          </motion.div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 p-4 rounded-xl mb-6 border text-sm font-medium"
              style={{
                background: 'rgba(248,113,113,0.08)',
                borderColor: 'rgba(248,113,113,0.25)',
                color: '#F87171',
              }}
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Skeleton loader */}
          {loading && (
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-14 mx-6 my-3 rounded-xl"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div
              className="rounded-2xl overflow-hidden border shadow-lg"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  {/* Table head */}
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                      {['Nombre', 'Propietario', 'Tipo / Tamaño', 'Estado', 'Fecha', 'Acciones'].map(
                        (col, idx) => (
                          <th
                            key={col}
                            className="px-6 py-4 text-xs font-bold uppercase tracking-wider"
                            style={{
                              color: 'var(--text-secondary)',
                              textAlign: idx === 5 ? 'right' : 'left',
                              background: 'var(--glass-bg)',
                            }}
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  {/* Table body */}
                  <tbody>
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <section className="relative group flex flex-col items-center justify-center w-full h-full mb-2">
                              <Link href="/upload">
                                <div className="file relative w-60 h-40 cursor-pointer origin-bottom [perspective:1500px] z-50">
                                  <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all ease duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]" />
                                  <div className="work-4 absolute inset-1 bg-zinc-400 rounded-2xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
                                  <div className="work-3 absolute inset-1 bg-zinc-300 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
                                  <div className="work-2 absolute inset-1 bg-zinc-200 rounded-2xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
                                  <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]" />
                                </div>
                              </Link>
                            </section>
                            <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              No hay archivos subidos todavía
                            </p>
                            <Link
                              href="/upload"
                              className="text-sm font-bold hover:underline"
                              style={{ color: 'var(--color-gold)' }}
                            >
                              Sube tu primer archivo aquí →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      files.map((file: FileRecord, index: number) => {
                        const ext = file.type?.toLowerCase() || '';
                        let iconColor = 'var(--text-secondary)';
                        if (ext.includes('csv')) iconColor = '#FACC15';
                        if (ext.includes('json')) iconColor = '#34D399';
                        if (ext.includes('txt')) iconColor = '#F87171';

                        return (
                          <motion.tr
                            key={file.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
                            className="group transition-colors"
                            style={{ borderBottom: '1px solid var(--card-border)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.background =
                                'var(--glass-border)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                            }}
                          >
                            {/* Name + tags */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                              <div className="flex items-center" style={{ color: 'var(--text-primary)' }}>
                                <svg
                                  className="w-5 h-5 mr-3 shrink-0"
                                  fill="none"
                                  stroke={iconColor}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="truncate max-w-[200px]">{file.original_name}</span>
                              </div>
                              {file.categories && file.categories.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 ml-8">
                                  {file.categories.map((cat: string) => (
                                    <span
                                      key={cat}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                      style={{
                                        background: 'var(--card-border)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--glass-border)',
                                      }}
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Owner */}
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {file.owner}
                            </td>

                            {/* Type / Size */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className="font-bold uppercase text-xs mr-2"
                                style={{ color: iconColor }}
                              >
                                {file.type}
                              </span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {formatBytes(file.size_bytes)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={file.status} />
                            </td>

                            {/* Date */}
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {new Date(file.uploaded_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/files/${file.id}`}
                                className="inline-flex items-center gap-1 font-semibold transition-all hover:gap-2"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-gold)';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                                }}
                              >
                                Detalles
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
