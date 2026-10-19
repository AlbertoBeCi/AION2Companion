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
import './styles/daily-overlay.css';
import { ensurePreferences } from './db/database';
import { TimerProvider } from './components/TimerProvider';
import { isDesktopWidget } from './lib/desktop';
import { DesktopFrame } from './components/DesktopFrame';
import './styles/desktop-frame.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } } });
void ensurePreferences();
if (isDesktopWidget) {
  document.documentElement.classList.add('daily-overlay-root', 'desktop-widget-root');
  document.body.classList.add('daily-overlay-body', 'desktop-widget-body');
}
else if (window.aionDesktop) document.documentElement.classList.add('desktop-app-root');

const appContent = isDesktopWidget ? <App /> : <TimerProvider><App /></TimerProvider>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>{window.aionDesktop && !isDesktopWidget ? <DesktopFrame>{appContent}</DesktopFrame> : appContent}</QueryClientProvider>
  </React.StrictMode>,
);
