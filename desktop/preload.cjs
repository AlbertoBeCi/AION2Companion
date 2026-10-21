const { contextBridge, ipcRenderer } = require('electron');
const widgetKind = process.argv.includes('--aion-alarms-widget') ? 'alarms' : process.argv.includes('--aion-daily-widget') ? 'daily' : null;

contextBridge.exposeInMainWorld('aionDesktop', {
  isWidget: Boolean(widgetKind),
  widgetKind,
  nativeWindowControls: process.platform === 'win32' && !widgetKind,
  setMainTitleBarTheme: (theme) => ipcRenderer.send('main:titlebar-theme', theme),
  openDaily: () => ipcRenderer.invoke('daily:open'),
  closeDaily: () => ipcRenderer.invoke('daily:close'),
  isDailyOpen: () => ipcRenderer.invoke('daily:status'),
  showMain: () => ipcRenderer.invoke('main:show'),
  resizeDaily: (width, height) => ipcRenderer.send('daily:resize', width, height),
  setDailyOpacity: (value) => ipcRenderer.send('daily:opacity', value),
  openAlarms: () => ipcRenderer.invoke('alarms:open'),
  closeAlarms: () => ipcRenderer.invoke('alarms:close'),
  isAlarmsOpen: () => ipcRenderer.invoke('alarms:status'),
  resizeAlarms: (width, height) => ipcRenderer.send('alarms:resize', width, height),
  setAlarmsOpacity: (value) => ipcRenderer.send('alarms:opacity', value),
  onAlarmsChanged: (callback) => {
    const listener = (_event, open) => callback(Boolean(open));
    ipcRenderer.on('alarms:changed', listener);
    return () => ipcRenderer.removeListener('alarms:changed', listener);
  },
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
