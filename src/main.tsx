import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/fonts.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './i18n';
import './styles/tokens.css';
import './styles/app.css';
import './styles/pwa.css';
import './styles/modern-neo.css';
import './styles/header.css';
import './styles/alarms.css';
import './styles/timer-settings.css';
import { ensurePreferences } from './db/database';
import { TimerProvider } from './components/TimerProvider';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } } });
void ensurePreferences();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}><TimerProvider><App /></TimerProvider></QueryClientProvider>
  </React.StrictMode>,
);
