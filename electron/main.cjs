const { app, BrowserWindow, Menu, dialog } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const serverEntry = path.join(projectRoot, 'server', 'index.ts');
const tsxCli = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
let serverProcess;
let shuttingDown = false;

function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = undefined;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const nodeExecutable = process.env.npm_node_execpath || process.execPath;
    const production = app.isPackaged || process.env.NODE_ENV === 'production';
    const child = spawn(nodeExecutable, [tsxCli, serverEntry], {
      cwd: projectRoot,
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: '0',
        NODE_ENV: production ? 'production' : 'development',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    serverProcess = child;

    let output = '';
    let settled = false;
    const startupTimeout = setTimeout(() => {
      fail(new Error('The local server took too long to start.'));
    }, 30000);

    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(startupTimeout);
      reject(error);
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/listening on (http:\/\/127\.0\.0\.1:\d+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(startupTimeout);
        resolve(match[1]);
      }
      if (output.length > 8192) output = output.slice(-4096);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      process.stderr.write(`[servidor] ${chunk}`);
    });

    child.once('error', (error) => {
      fail(new Error(`Could not start the local server: ${error.message}`));
    });

    child.once('exit', (code, signal) => {
      if (!settled) {
        fail(new Error(`The local server exited during startup (code ${code}, signal ${signal}).`));
      } else if (!shuttingDown) {
        void dialog.showMessageBox({
          type: 'error',
          title: 'Servidor local detenido',
          message: 'The application server stopped unexpectedly.',
          detail: `Code: ${code ?? 'unknown'}${signal ? ` · Signal: ${signal}` : ''}`,
        }).then(() => app.quit());
      }
      if (serverProcess === child) serverProcess = undefined;
    });
  });
}

function setApplicationMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Quit', accelerator: 'CmdOrCtrl+Q' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize', label: 'Minimize' }, { role: 'close', label: 'Close' }],
    },
  ]));
}

async function createWindow() {
  let serverUrl;
  try {
    serverUrl = await startServer();
  } catch (error) {
    stopServer();
    await dialog.showMessageBox({
      type: 'error',
      title: 'Could not start Planetary Terrain Explorer',
      message: error instanceof Error ? error.message : String(error),
      detail: 'Make sure dependencies are installed, then run npm start again.',
    });
    app.quit();
    return;
  }

  if (shuttingDown) return;

  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#07090e',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      const { shell } = require('electron');
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  try {
    await window.loadURL(serverUrl);
  } catch (error) {
    await dialog.showMessageBox(window, {
      type: 'error',
      title: 'Could not load the application',
      message: error instanceof Error ? error.message : String(error),
    });
    window.close();
  }
}

app.whenReady().then(() => {
  setApplicationMenu();
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !shuttingDown) {
      void createWindow();
    }
  });
}).catch((error) => {
  console.error('Error starting Electron:', error);
  app.quit();
});

app.on('before-quit', () => {
  shuttingDown = true;
  stopServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('exit', stopServer);
