// Proceso principal de Electron: abre una ventana con la app web ya compilada (dist/).
// Dos productos desde el mismo código: "coach" (draft manual) y "broadcast" (además lee el cliente de League, solo lectura).
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

const MODE = process.argv.includes('--broadcast') ? 'broadcast' : process.env.APP_MODE || require('../package.json').appMode || 'coach';
const BROADCAST = MODE === 'broadcast';

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1200, minHeight: 700,
    backgroundColor: '#07090d', title: BROADCAST ? 'Draft Reimagined Broadcast' : 'Draft Reimagined', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, preload: BROADCAST ? path.join(__dirname, 'preload.cjs') : undefined },
  });
  const devUrl = process.env.ELECTRON_DEV_URL; // npm run electron:dev apunta al servidor de Vite
  const live = BROADCAST && process.argv.includes('--live'); // --live: conecta con el cliente al abrir
  if (devUrl) win.loadURL(devUrl + (live ? '?live' : '')); else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), live ? { query: { live: '1' } } : undefined);
  // Los enlaces externos se abren en el navegador, no dentro de la app.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://') && !url.startsWith(devUrl ?? 'file://')) { e.preventDefault(); shell.openExternal(url); } });
}

// Lectura del cliente: solo en la versión broadcast, y solo lectura (ver lcu.cjs).
let reader = null;
if (BROADCAST) {
  const { createReader } = require('./lcu.cjs');
  const debug = !!process.env.LCU_DEBUG;
  ipcMain.handle('lcu:start', (event) => {
    reader?.stop();
    const send = (channel, payload) => { if (!event.sender.isDestroyed()) event.sender.send(channel, payload); };
    reader = createReader({
      onSession: (s) => { if (debug) console.log('[lcu] session', s ? 'updated' : 'closed'); send('lcu:session', s); },
      onStatus: (s) => { if (debug) console.log('[lcu] status', s); send('lcu:status', s); },
    });
  });
  ipcMain.handle('lcu:stop', () => { reader?.stop(); reader = null; });
  app.on('before-quit', () => reader?.stop());
}

if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
