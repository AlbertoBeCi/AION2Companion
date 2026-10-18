import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './i18n';
import './styles/tokens.css';
import './styles/app.css';
import './styles/pwa.css';
import { ensurePreferences } from './db/database';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } } });
void ensurePreferences();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </React.StrictMode>,
);
