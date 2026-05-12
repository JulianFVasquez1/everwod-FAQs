import React from 'react';
import FileUploader from '../../components/FileUploader';
import AuthGuard from '../../components/AuthGuard';

export const metadata = {
  title: 'Upload file | Everwod FAQ Cloud',
};

export default function UploadPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Usamos el componente FileUploader de cliente */}
          <FileUploader />
        </div>
      </div>
    </AuthGuard>
  );
}
