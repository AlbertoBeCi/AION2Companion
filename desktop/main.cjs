const { app, BrowserWindow, ipcMain, protocol, net, screen, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const APP_URL = 'aion2://app/';
const dist = path.join(__dirname, '..', 'dist');
const preload = path.join(__dirname, 'preload.cjs');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
let mainWindow;
let dailyWindow;
let openingDaily;
let saveBoundsTimer;
let savingBounds = Promise.resolve();

app.setName('AION2 Companion');
app.setPath('userData', process.env.AION2_DESKTOP_TEST_DATA
  ? path.resolve(process.env.AION2_DESKTOP_TEST_DATA)
  : path.join(app.getPath('appData'), 'AION2Companion'));
protocol.registerSchemesAsPrivileged([{ scheme: 'aion2', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

function isAppURL(value) {
  try { const url = new URL(value); return url.protocol === 'aion2:' && url.host === 'app'; } catch { return false; }
}

function secureWindow(win) {
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => {
    // External links use the user's browser; never load remote pages into the desktop app.
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppURL(url)) {
      event.preventDefault();
      if (url.startsWith('https://')) void shell.openExternal(url);
    }
  });
  win.webContents.on('will-attach-webview', (event) => event.preventDefault());
}

function webPreferences(widget = false) {
  return { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false,
    additionalArguments: widget ? ['--aion-daily-widget'] : [] };
}

function showMain() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function notifyDaily() {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('daily:changed', Boolean(dailyWindow && !dailyWindow.isDestroyed()));
}

function saveDailyBounds() {
  if (!dailyWindow || dailyWindow.isDestroyed()) return savingBounds;
  const bounds = dailyWindow.getBounds();
  savingBounds = savingBounds.catch(() => {}).then(async () => {
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(path.join(app.getPath('userData'), 'daily-window.json'), JSON.stringify(bounds));
  });
  return savingBounds;
}

async function dailyBounds() {
  await savingBounds.catch(() => {});
  let saved;
  try { saved = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'daily-window.json'), 'utf8')); } catch { /* First launch. */ }
  const valid = saved && ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(saved[key]));
  const area = (valid ? screen.getDisplayMatching(saved) : screen.getPrimaryDisplay()).workArea;
  const width = Math.min(area.width, Math.max(300, valid ? saved.width : 440));
  const height = Math.min(area.height, Math.max(260, valid ? saved.height : 600));
  return { width, height,
    x: Math.max(area.x, Math.min(valid ? saved.x : area.x + area.width - width - 24, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(valid ? saved.y : area.y + 40, area.y + area.height - height)) };
}

async function openDaily() {
  if (openingDaily) return openingDaily;
  if (dailyWindow && !dailyWindow.isDestroyed()) { dailyWindow.show(); dailyWindow.setAlwaysOnTop(true, 'screen-saver'); dailyWindow.focus(); return; }
  openingDaily = (async () => {
    const bounds = await dailyBounds();
    const win = new BrowserWindow({ ...bounds, minWidth: 300, minHeight: 260, frame: false,
      alwaysOnTop: true, hasShadow: false, thickFrame: false, transparent: true, backgroundColor: '#00000000', show: false,
      resizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true,
      title: 'Diarias · AION2Companion', icon: path.join(__dirname, 'icon.png'), webPreferences: webPreferences(true) });
    dailyWindow = win;
    secureWindow(win);
    const scheduleSave = () => {
      clearTimeout(saveBoundsTimer);
      saveBoundsTimer = setTimeout(() => { void saveDailyBounds().catch(() => {}); }, 300);
    };
    win.on('move', scheduleSave);
    win.on('resize', scheduleSave);
    win.on('close', () => { clearTimeout(saveBoundsTimer); void saveDailyBounds().catch(() => {}); });
    win.on('closed', () => { dailyWindow = undefined; notifyDaily(); });
    try {
      await win.loadURL(`${APP_URL}?widget=daily`);
      win.show();
      win.setAlwaysOnTop(true, 'screen-saver');
      notifyDaily();
    } catch (error) { win.destroy(); throw error; }
  })();
  try { await openingDaily; } finally { openingDaily = undefined; }
}

function trustedSender(event) {
  const sender = event.sender;
  return (sender === mainWindow?.webContents || sender === dailyWindow?.webContents)
    && event.senderFrame === sender.mainFrame && isAppURL(event.senderFrame.url);
}

function handle(channel, action) {
  ipcMain.handle(channel, (event) => {
    if (!trustedSender(event)) throw new Error('Untrusted window');
    return action();
  });
}

function handleMain(channel, action) {
  ipcMain.handle(channel, (event) => {
    if (!trustedSender(event) || event.sender !== mainWindow?.webContents) throw new Error('Untrusted window');
    return action();
  });
}

async function serveApp(request) {
  const url = new URL(request.url);
  if (url.host !== 'app' || request.method !== 'GET') return new Response('Not found', { status: 404 });
  if (url.pathname === '/fbapi/api/fieldboss.php') {
    const server = url.searchParams.get('server') ?? '';
    if (!/^(eu|nae|naw|sa)-[a-z]{3,20}$/.test(server) || url.searchParams.get('action') !== 'feed') return new Response('Invalid feed', { status: 400 });
    const query = new URLSearchParams({ action: 'feed', server });
    try { return await net.fetch(`https://aion2companion.netlify.app/fbapi/api/fieldboss.php?${query}`); }
    catch { return new Response('Feed unavailable', { status: 503 }); }
  }
  let file;
  try { file = path.resolve(dist, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`); }
  catch { return new Response('Invalid path', { status: 400 }); }
  const relative = path.relative(dist, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 });
  try {
    if (!(await fs.stat(file)).isFile()) return new Response('Not found', { status: 404 });
    const response = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', csp);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, headers });
  } catch { return new Response('Not found', { status: 404 }); }
}

async function createMain() {
  const area = screen.getPrimaryDisplay().workArea;
  mainWindow = new BrowserWindow({ width: Math.min(1400, area.width), height: Math.min(900, area.height), minWidth: 800, minHeight: 600,
    frame: false, thickFrame: false, hasShadow: false, fullscreenable: false,
    show: false, backgroundColor: '#1e1e1e', title: 'AION2Companion', icon: path.join(__dirname, 'icon.png'), webPreferences: webPreferences() });
  secureWindow(mainWindow);
  const notifyMaximized = () => mainWindow?.webContents.send('main:maximized', mainWindow.isMaximized());
  mainWindow.on('maximize', notifyMaximized);
  mainWindow.on('unmaximize', notifyMaximized);
  mainWindow.on('closed', () => { mainWindow = undefined; dailyWindow?.close(); });
  await mainWindow.loadURL(APP_URL);
  mainWindow.show();
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showMain);
  app.whenReady().then(async () => {
    protocol.handle('aion2', serveApp);
    const { session } = require('electron');
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    handle('daily:open', openDaily);
    handle('daily:close', () => dailyWindow?.close());
    handle('daily:status', () => Boolean(dailyWindow && !dailyWindow.isDestroyed()));
    handle('main:show', showMain);
    handleMain('main:minimize', () => mainWindow.minimize());
    handleMain('main:toggle-maximize', () => {
      if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
      return mainWindow.isMaximized();
    });
    handleMain('main:is-maximized', () => mainWindow.isMaximized());
    handleMain('main:bounds', () => mainWindow.getBounds());
    handleMain('main:close', () => mainWindow.close());
    ipcMain.on('main:resize', (event, bounds) => {
      if (!trustedSender(event) || event.sender !== mainWindow?.webContents || mainWindow.isMaximized()) return;
      if (!bounds || !['x', 'y', 'width', 'height'].every((key) => Number.isFinite(bounds[key]))) return;
      const area = screen.getDisplayMatching(mainWindow.getBounds()).workArea;
      const width = Math.round(Math.max(800, Math.min(bounds.width, area.width)));
      const height = Math.round(Math.max(600, Math.min(bounds.height, area.height)));
      mainWindow.setBounds({ width, height,
        x: Math.round(Math.max(area.x, Math.min(bounds.x, area.x + area.width - width))),
        y: Math.round(Math.max(area.y, Math.min(bounds.y, area.y + area.height - height))) });
    });
    ipcMain.on('daily:opacity', (event, value) => {
      if (!trustedSender(event) || event.sender !== dailyWindow?.webContents || !Number.isFinite(value)) return;
      dailyWindow.setOpacity(Math.max(0.25, Math.min(1, value)));
    });
    ipcMain.on('daily:resize', (event, width, height) => {
      if (!trustedSender(event) || event.sender !== dailyWindow?.webContents || !Number.isFinite(width) || !Number.isFinite(height)) return;
      const bounds = dailyWindow.getBounds();
      const area = screen.getDisplayMatching(bounds).workArea;
      // Windows locks min/max bounds while a transparent window is non-resizable.
      // Enable resizing only for this explicit corner-handle request.
      dailyWindow.setResizable(true);
      dailyWindow.setSize(Math.round(Math.max(300, Math.min(width, area.width))), Math.round(Math.max(260, Math.min(height, area.height))));
      dailyWindow.setResizable(false);
      dailyWindow.setAlwaysOnTop(true, 'screen-saver');
    });
    await createMain();
  }).catch((error) => {
    dialog.showErrorBox('AION2Companion', `No se pudo iniciar la app.\n${error.message}`);
    app.quit();
  });
  app.on('window-all-closed', () => app.quit());
}
