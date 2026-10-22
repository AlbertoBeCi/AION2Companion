const { app, BrowserWindow, ipcMain, protocol, net, screen, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const APP_URL = 'aion2://app/';
const dist = path.join(__dirname, '..', 'dist');
const preload = path.join(__dirname, 'preload.cjs');
const nativeWindowControls = process.platform === 'win32';
const mainMinSize = { width: 360, height: 320 };
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const fieldBossFeedUrl = 'https://www.aion2timers.com/api/fieldboss.php';
const fieldBossFeedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
let mainWindow;
const widgets = Object.fromEntries(['daily', 'alarms'].map((kind) => [kind, {
  kind, window: undefined, opening: undefined, saveTimer: undefined, saving: Promise.resolve(),
}]));

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

function webPreferences(widget) {
  return { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false,
    additionalArguments: widget ? [`--aion-${widget}-widget`] : [] };
}

function showMain() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function notifyWidget(state) {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(`${state.kind}:changed`, Boolean(state.window && !state.window.isDestroyed()));
}

function saveWidgetBounds(state) {
  if (!state.window || state.window.isDestroyed()) return state.saving;
  const bounds = state.window.getBounds();
  state.saving = state.saving.catch(() => {}).then(async () => {
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(path.join(app.getPath('userData'), `${state.kind}-window.json`), JSON.stringify(bounds));
  });
  return state.saving;
}

async function widgetBounds(state) {
  await state.saving.catch(() => {});
  let saved;
  try { saved = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), `${state.kind}-window.json`), 'utf8')); } catch { /* First launch. */ }
  const valid = saved && ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(saved[key]));
  const area = (valid ? screen.getDisplayMatching(saved) : screen.getPrimaryDisplay()).workArea;
  const width = Math.min(area.width, Math.max(300, valid ? saved.width : 440));
  const height = Math.min(area.height, Math.max(260, valid ? saved.height : state.kind === 'daily' ? 600 : 480));
  return { width, height,
    x: Math.max(area.x, Math.min(valid ? saved.x : area.x + area.width - width - 24, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(valid ? saved.y : area.y + (state.kind === 'daily' ? 40 : 100), area.y + area.height - height)) };
}

async function openWidget(state) {
  if (state.opening) return state.opening;
  if (state.window && !state.window.isDestroyed()) { state.window.show(); state.window.setAlwaysOnTop(true, 'screen-saver'); state.window.focus(); return; }
  state.opening = (async () => {
    const bounds = await widgetBounds(state);
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const win = new BrowserWindow({ ...bounds, minWidth: 300, minHeight: 260, frame: false,
      alwaysOnTop: true, hasShadow: false, thickFrame: false, transparent: true, backgroundColor: '#00000000', show: false,
      resizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true,
      title: `${state.kind === 'daily' ? 'Diarias' : 'Mis alarmas'} · AION2Companion`, icon: path.join(__dirname, 'icon.png'), webPreferences: webPreferences(state.kind) });
    state.window = win;
    secureWindow(win);
    const scheduleSave = () => {
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(() => { void saveWidgetBounds(state).catch(() => {}); }, 300);
    };
    win.on('move', scheduleSave);
    win.on('resize', scheduleSave);
    win.on('close', () => { clearTimeout(state.saveTimer); void saveWidgetBounds(state).catch(() => {}); });
    win.on('closed', () => { state.window = undefined; notifyWidget(state); });
    try {
      await win.loadURL(`${APP_URL}?widget=${state.kind}`);
      if (win.isDestroyed()) return;
      win.show();
      win.setAlwaysOnTop(true, 'screen-saver');
      notifyWidget(state);
    } catch (error) { if (!win.isDestroyed()) win.destroy(); throw error; }
  })();
  try { await state.opening; } finally { state.opening = undefined; }
}

function trustedSender(event) {
  const sender = event.sender;
  return (sender === mainWindow?.webContents || Object.values(widgets).some(state => sender === state.window?.webContents))
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
    try {
      const upstream = new URL(fieldBossFeedUrl);
      upstream.search = query.toString();
      const response = await net.fetch(upstream.toString(), { headers: {
        accept: 'application/json, */*',
        'accept-language': 'en-US,en;q=0.9',
        origin: 'https://www.aion2timers.com',
        referer: 'https://www.aion2timers.com/world-boss-timer/',
        'user-agent': fieldBossFeedUserAgent,
      } });
      if (!response.ok) return new Response(JSON.stringify({ ok: false, error: 'Community feed unavailable' }), {
        status: 502, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
      const payload = await response.json();
      if (!payload || payload.ok !== true || !payload.kills || typeof payload.kills !== 'object' || Array.isArray(payload.kills)) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid community feed response' }), {
          status: 502, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        });
      }
      const kills = Object.fromEntries(['elyos24', 'asmo24'].flatMap((id) => {
        const entry = payload.kills[id];
        return entry && typeof entry === 'object' && !Array.isArray(entry) ? [[id, entry]] : [];
      }));
      return new Response(JSON.stringify({ ok: true, ...(typeof payload.now === 'number' ? { now: payload.now } : {}), kills }), {
        status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Community feed request failed' }), {
        status: 502, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
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
  mainWindow = new BrowserWindow({ width: Math.min(1400, area.width), height: Math.min(900, area.height), minWidth: mainMinSize.width, minHeight: mainMinSize.height,
    // Keep the native resize frame and caption buttons so Windows owns Snap and its layout menu.
    ...(nativeWindowControls ? {
      titleBarStyle: 'hidden', titleBarOverlay: { color: '#1e1e1e', symbolColor: '#f6eedc', height: 44 },
      thickFrame: true, hasShadow: true,
    } : { frame: false, thickFrame: false, hasShadow: false }),
    resizable: true, maximizable: true, fullscreenable: false,
    show: false, backgroundColor: '#1e1e1e', title: 'AION2Companion', icon: path.join(__dirname, 'icon.png'), webPreferences: webPreferences() });
  secureWindow(mainWindow);
  const notifyMaximized = () => mainWindow?.webContents.send('main:maximized', mainWindow.isMaximized());
  mainWindow.on('maximize', notifyMaximized);
  mainWindow.on('unmaximize', notifyMaximized);
  mainWindow.on('closed', () => { mainWindow = undefined; for (const state of Object.values(widgets)) state.window?.close(); });
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
    for (const state of Object.values(widgets)) {
      handle(`${state.kind}:open`, () => openWidget(state));
      handle(`${state.kind}:close`, () => state.window?.close());
      handle(`${state.kind}:status`, () => Boolean(state.window && !state.window.isDestroyed()));
      ipcMain.on(`${state.kind}:opacity`, (event, value) => {
        const win = state.window;
        if (!win || !trustedSender(event) || event.sender !== win.webContents || !Number.isFinite(value)) return;
        win.setOpacity(Math.max(0.25, Math.min(1, value)));
      });
      ipcMain.on(`${state.kind}:resize`, (event, width, height) => {
        const win = state.window;
        if (!win || !trustedSender(event) || event.sender !== win.webContents || !Number.isFinite(width) || !Number.isFinite(height)) return;
        const area = screen.getDisplayMatching(win.getBounds()).workArea;
        // Windows locks min/max bounds while a transparent window is non-resizable.
        win.setResizable(true);
        win.setSize(Math.round(Math.max(300, Math.min(width, area.width))), Math.round(Math.max(260, Math.min(height, area.height))));
        win.setResizable(false);
        win.setAlwaysOnTop(true, 'screen-saver');
      });
    }
    handle('main:show', showMain);
    handleMain('main:minimize', () => mainWindow.minimize());
    handleMain('main:toggle-maximize', () => {
      if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
      return mainWindow.isMaximized();
    });
    handleMain('main:is-maximized', () => mainWindow.isMaximized());
    handleMain('main:bounds', () => mainWindow.getBounds());
    handleMain('main:close', () => mainWindow.close());
    ipcMain.on('main:titlebar-theme', (event, theme) => {
      if (!nativeWindowControls || !trustedSender(event) || event.sender !== mainWindow?.webContents) return;
      if (theme !== 'dark' && theme !== 'light') return;
      mainWindow.setTitleBarOverlay(theme === 'dark'
        ? { color: '#1e1e1e', symbolColor: '#f6eedc' }
        : { color: '#ffffff', symbolColor: '#111111' });
    });
    ipcMain.on('main:resize', (event, bounds) => {
      if (!trustedSender(event) || event.sender !== mainWindow?.webContents || mainWindow.isMaximized()) return;
      if (!bounds || !['x', 'y', 'width', 'height'].every((key) => Number.isFinite(bounds[key]))) return;
      const area = screen.getDisplayMatching(mainWindow.getBounds()).workArea;
      const width = Math.round(Math.max(mainMinSize.width, Math.min(bounds.width, area.width)));
      const height = Math.round(Math.max(mainMinSize.height, Math.min(bounds.height, area.height)));
      mainWindow.setBounds({ width, height,
        x: Math.round(Math.max(area.x, Math.min(bounds.x, area.x + area.width - width))),
        y: Math.round(Math.max(area.y, Math.min(bounds.y, area.y + area.height - height))) });
    });
    await createMain();
  }).catch((error) => {
    dialog.showErrorBox('AION2Companion', `No se pudo iniciar la app.\n${error.message}`);
    app.quit();
  });
  app.on('window-all-closed', () => app.quit());
}

