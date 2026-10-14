// Proceso principal de Electron: abre una ventana con la app web ya compilada (dist/).
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1200, minHeight: 700,
    backgroundColor: '#07090d', title: 'Draft Reimagined', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  const devUrl = process.env.ELECTRON_DEV_URL; // npm run electron:dev apunta al servidor de Vite
  if (devUrl) win.loadURL(devUrl); else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  // Los enlaces externos se abren en el navegador, no dentro de la app.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://') && !url.startsWith(devUrl ?? 'file://')) { e.preventDefault(); shell.openExternal(url); } });
}

if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
