/**
 * Bike Workshop Manager - Electron Preload Bridge
 * Secure IPC exposure to Renderer Process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  saveBackupFile: (binaryData) => ipcRenderer.invoke('save-backup-file', binaryData),
  restoreBackupFile: () => ipcRenderer.invoke('restore-backup-file')
});
