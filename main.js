const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const IS_PACKAGED = app.isPackaged;

function updateApp() {
  const win = BrowserWindow.getFocusedWindow();

  if (IS_PACKAGED) {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Updates',
      message: 'To update, download the latest version from the project page.'
    });
    return;
  }

  exec('git pull origin main', { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Update Failed',
        message: 'Git pull failed',
        detail: stderr || err.message
      });
      return;
    }

    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Complete',
      message: 'Todo Garden has been updated!',
      detail: stdout.trim() + '\n\nThe app will now reload.'
    }).then(() => {
      win.loadFile(path.join(__dirname, 'index.html'));
    });
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [];

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Check for Updates...', click: updateApp },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  template.push(
    {
      label: 'File',
      submenu: [
        ...(!isMac ? [{ label: 'Check for Updates...', click: updateApp }, { type: 'separator' }] : []),
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [{ role: 'zoom' }] : []),
        { role: 'close' }
      ]
    }
  );

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 600,
    minHeight: 500,
    ...(isMac ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 16 } } : {}),
    backgroundColor: '#f8f7f4',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

// ── Garden save files (cross-platform: ~/Todo-garden/<name>.json) ──
const SAVE_DIR = path.join(app.getPath('home'), 'Todo-garden');

function safeName(name) {
  return (name || 'garden').replace(/[<>:"/\\|?*]/g, '_').trim() || 'garden';
}

function ensureSaveDir() {
  if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });
}

ipcMain.handle('save-garden-file', async (_event, data, gardenName) => {
  try {
    ensureSaveDir();
    const file = path.join(SAVE_DIR, safeName(gardenName) + '.json');
    fs.writeFileSync(file, data, 'utf-8');
    return { ok: true, path: file };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('show-save-file', async (_event, gardenName) => {
  const { shell } = require('electron');
  ensureSaveDir();
  const file = path.join(SAVE_DIR, safeName(gardenName) + '.json');
  if (fs.existsSync(file)) {
    shell.showItemInFolder(file);
  } else {
    shell.openPath(SAVE_DIR);
  }
  return { ok: true };
});

ipcMain.handle('load-garden-file', async (_event, gardenName) => {
  try {
    const file = path.join(SAVE_DIR, safeName(gardenName) + '.json');
    if (!fs.existsSync(file)) return { ok: true, data: null };
    const data = fs.readFileSync(file, 'utf-8');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
