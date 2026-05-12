'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm font-medium text-secondary hover:text-primary transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
