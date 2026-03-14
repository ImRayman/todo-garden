const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');

const SOURCE_DIR = '/Applications/Projects/ClaudeProjects/todo-garden';
const ENV_PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin';
const EXEC_OPTS = { cwd: SOURCE_DIR, env: { ...process.env, PATH: ENV_PATH } };

function updateApp() {
  const win = BrowserWindow.getFocusedWindow();

  exec('git pull origin main', EXEC_OPTS, (err, stdout, stderr) => {
    if (err) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Update Failed',
        message: 'Git pull failed',
        detail: stderr || err.message
      });
      return;
    }

    const pullMsg = stdout.trim();

    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Complete',
      message: 'Todo Garden has been updated!',
      detail: pullMsg + '\n\nThe app will now reload.'
    }).then(() => {
      win.loadFile(path.join(SOURCE_DIR, 'index.html'));
    });
  });
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: updateApp
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
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
        { role: 'zoom' },
        { role: 'close' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 600,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#f8f7f4',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(SOURCE_DIR, 'index.html'));
}

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
