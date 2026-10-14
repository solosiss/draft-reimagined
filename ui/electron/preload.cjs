// Puente seguro entre la interfaz y el lector del cliente (solo lectura).
const { contextBridge, ipcRenderer } = require('electron');

const on = (channel) => (cb) => {
  const fn = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('lcu', {
  start: () => ipcRenderer.invoke('lcu:start'),
  stop: () => ipcRenderer.invoke('lcu:stop'),
  onSession: on('lcu:session'),
  onStatus: on('lcu:status'),
});
