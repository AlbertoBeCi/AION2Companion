/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface Window {
  aionDesktop?: {
    isWidget: boolean;
    openDaily: () => Promise<void>;
    closeDaily: () => Promise<void>;
    isDailyOpen: () => Promise<boolean>;
    showMain: () => Promise<void>;
    resizeDaily: (width: number, height: number) => void;
    setDailyOpacity: (value: number) => void;
    minimizeMain: () => Promise<void>;
    toggleMaximizeMain: () => Promise<boolean>;
    isMainMaximized: () => Promise<boolean>;
    getMainBounds: () => Promise<{ x: number; y: number; width: number; height: number }>;
    resizeMain: (bounds: { x: number; y: number; width: number; height: number }) => void;
    closeMain: () => Promise<void>;
    onMainMaximized: (callback: (maximized: boolean) => void) => () => void;
    onDailyChanged: (callback: (open: boolean) => void) => () => void;
  };
}
