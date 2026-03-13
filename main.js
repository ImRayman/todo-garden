const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');

const SOURCE_DIR = '/Applications/Projects/HTML/todo-garden';

function updateApp() {
  const win = BrowserWindow.getFocusedWindow();

  // Pull latest from main
  exec('git pull origin main', { cwd: SOURCE_DIR }, (err, stdout, stderr) => {
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

    // Always rebuild — source may be ahead of the running app
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Building',
      message: 'Rebuilding Todo Garden...',
      detail: pullMsg + '\n\nThis may take a minute.',
      buttons: ['OK']
    });

    exec('npm run build', { cwd: SOURCE_DIR }, (buildErr, buildOut, buildStderr) => {
      if (buildErr) {
        dialog.showMessageBox(win, {
          type: 'error',
          title: 'Build Failed',
          message: 'Build failed',
          detail: buildStderr || buildErr.message
        });
        return;
      }

      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Complete',
        message: 'Todo Garden has been updated!',
        detail: 'Please reopen the app to use the new version.'
      }).then(() => {
        app.quit();
      });
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

  win.loadFile('index.html');
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
