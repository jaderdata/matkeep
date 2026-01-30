
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors theme="dark" />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Registra o Service Worker para suporte Offline e PWA (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado com sucesso!', reg))
      .catch(err => console.log('Erro ao registrar Service Worker:', err));
  });
} else if (import.meta.env.DEV) {
  // Em desenvolvimento, tenta desregistrar qualquer SW existente para evitar problemas de cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Service Worker desregistrado em modo DEV');
      }
    });
  }
}
