/**
 * Bike Workshop Manager - Electron Main Process
 * Secure, offline desktop application configuration for Windows (.exe)
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Bike Workshop Manager',
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Native IPC File Backup / Restore handlers for Electron
ipcMain.handle('save-backup-file', async (event, binaryData) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Backup Bike Workshop Database',
    defaultPath: `bike_workshop_backup_${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'SQLite Database (*.db)', extensions: ['db', 'sqlite'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(binaryData));
    return { success: true, filePath };
  }
  return { success: false };
});

ipcMain.handle('restore-backup-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Select Backup Database to Restore',
    filters: [{ name: 'SQLite Database (*.db)', extensions: ['db', 'sqlite'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths[0]) {
    const fileBuffer = fs.readFileSync(filePaths[0]);
    return { success: true, binaryData: Array.from(fileBuffer) };
  }
  return { success: false };
});
