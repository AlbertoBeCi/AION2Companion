const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aionDesktop', {
  isWidget: process.argv.includes('--aion-daily-widget'),
  openDaily: () => ipcRenderer.invoke('daily:open'),
  closeDaily: () => ipcRenderer.invoke('daily:close'),
  isDailyOpen: () => ipcRenderer.invoke('daily:status'),
  showMain: () => ipcRenderer.invoke('main:show'),
  resizeDaily: (width, height) => ipcRenderer.send('daily:resize', width, height),
  setDailyOpacity: (value) => ipcRenderer.send('daily:opacity', value),
  minimizeMain: () => ipcRenderer.invoke('main:minimize'),
  toggleMaximizeMain: () => ipcRenderer.invoke('main:toggle-maximize'),
  isMainMaximized: () => ipcRenderer.invoke('main:is-maximized'),
  getMainBounds: () => ipcRenderer.invoke('main:bounds'),
  resizeMain: (bounds) => ipcRenderer.send('main:resize', bounds),
  closeMain: () => ipcRenderer.invoke('main:close'),
  onMainMaximized: (callback) => {
    const listener = (_event, maximized) => callback(Boolean(maximized));
    ipcRenderer.on('main:maximized', listener);
    return () => ipcRenderer.removeListener('main:maximized', listener);
  },
  onDailyChanged: (callback) => {
    const listener = (_event, open) => callback(Boolean(open));
    ipcRenderer.on('daily:changed', listener);
    return () => ipcRenderer.removeListener('daily:changed', listener);
  },
});
