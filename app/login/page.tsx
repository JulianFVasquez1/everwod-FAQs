'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '../../lib/auth';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/');
      } else {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        
        // Check if confirmation is required (session might be null if email confirmation is on)
        if (data.user && !data.session) {
          setRegSuccess(true);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  if (regSuccess) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 glass p-10 text-center"
        >
          <div className="w-20 h-20 bg-[#FACC15]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#FFB800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary">¡Registro Exitoso!</h2>
          <p className="text-secondary">
            Hemos enviado un correo de validación a <span className="text-primary font-medium">{email}</span>. 
            Por favor verifica tu bandeja de entrada para activar tu cuenta.
          </p>
          <button
            onClick={() => {
              setRegSuccess(false);
              setIsLogin(true);
            }}
            className="w-full py-3 px-4 bg-[#FACC15] hover:bg-[#eab308] text-black font-bold rounded-xl transition-colors mt-4"
          >
            Volver al Inicio de Sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 glass p-10"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary tracking-tight">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary font-medium">
            Everwod FAQ Cloud
          </p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl mb-6">
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${isLogin ? 'bg-[#FACC15] text-black shadow-lg' : 'text-secondary hover:text-primary'}`}
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${!isLogin ? 'bg-[#FACC15] text-black shadow-lg' : 'text-secondary hover:text-primary'}`}
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            Registrarse
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-card-border rounded-xl focus:ring-2 focus:ring-[#FACC15] text-primary outline-none transition-all"
                placeholder="ejemplo@everwod.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-card-border rounded-xl focus:ring-2 focus:ring-[#FACC15] text-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl text-[#F87171] text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] text-sm font-bold text-black bg-[#FACC15] hover:bg-[#eab308] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FACC15] transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </span>
            ) : isLogin ? 'Ingresar' : 'Crear Cuenta'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
