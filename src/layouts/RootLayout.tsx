import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const RootLayout: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
          }}
        />
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  );
};
