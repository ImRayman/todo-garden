const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveGardenFile: (data, gardenName) => ipcRenderer.invoke('save-garden-file', data, gardenName),
  loadGardenFile: (gardenName) => ipcRenderer.invoke('load-garden-file', gardenName),
  showSaveFile: (gardenName) => ipcRenderer.invoke('show-save-file', gardenName)
});
