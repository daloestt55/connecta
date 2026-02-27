import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Mitigates black screen issues on some Windows GPU drivers
app.disableHardwareAcceleration();

const userDataPath = path.join(process.env.LOCALAPPDATA || app.getPath('appData'), 'Connecta');
try {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  app.setPath('userData', userDataPath);
  console.log('[Electron] userData path:', userDataPath);
} catch (error) {
  console.error('[Electron] Failed to set userData path:', error);
}

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showStartupError(window: BrowserWindow, title: string, details: string) {
  const html = `
    <html>
      <body style="margin:0;background:#0A0A0C;color:#F3F4F6;font-family:Inter,system-ui,sans-serif;">
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
          <div style="max-width:860px;width:100%;background:#111218;border-radius:12px;padding:20px;">
            <h2 style="margin:0 0 12px 0;">${escapeHtml(title)}</h2>
            <p style="opacity:.85;">Connecta не смог загрузить интерфейс. Нажмите F12 или Ctrl+Shift+I для DevTools.</p>
            <pre style="white-space:pre-wrap;word-break:break-word;opacity:.95;">${escapeHtml(details)}</pre>
          </div>
        </div>
      </body>
    </html>
  `;

  window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function getProductionIndexCandidates() {
  return [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
  ];
}

async function loadProductionApp(window: BrowserWindow) {
  const candidates = getProductionIndexCandidates();

  for (const candidate of candidates) {
    try {
      const exists = fs.existsSync(candidate);
      console.log('[Electron] Checking index candidate:', candidate, 'exists =', exists);
      if (!exists) continue;
      await window.loadFile(candidate);
      console.log('[Electron] Loaded production file:', candidate);
      return;
    } catch (error) {
      console.error('[Electron] Failed to load candidate:', candidate, error);
    }
  }

  throw new Error(`Failed to load renderer. Checked: ${candidates.join(' | ')}`);
}

function createWindow() {
  const preloadCandidates = [
    path.join(app.getAppPath(), 'preload.js'),
    path.join(app.getAppPath(), 'dist-electron', 'preload.js'),
    path.join(process.resourcesPath, 'app.asar', 'preload.js'),
    path.join(process.resourcesPath, 'app', 'preload.js'),
    path.join(process.resourcesPath, 'app.asar', 'dist-electron', 'preload.js'),
    path.join(process.resourcesPath, 'app', 'dist-electron', 'preload.js'),
  ];
  const preloadPath = preloadCandidates.find(candidate => fs.existsSync(candidate)) || preloadCandidates[0];
  console.log('[Electron] Preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: true,
    backgroundColor: '#0A0A0C',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: true,
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.warn('[Electron] ready-to-show timeout, forcing window.show()');
      mainWindow.show();
    }
  }, 8000);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[Electron] did-fail-load:', { errorCode, errorDescription, validatedURL });
    if (!isDev && errorCode !== -3) {
      showStartupError(
        mainWindow!,
        'Renderer did-fail-load',
        `errorCode: ${errorCode}\nerrorDescription: ${errorDescription}\nurl: ${validatedURL}`
      );
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Electron] render-process-gone:', details);
    if (!isDev) {
      showStartupError(
        mainWindow!,
        'Renderer process crashed',
        JSON.stringify(details, null, 2)
      );
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] did-finish-load:', mainWindow?.webContents.getURL());
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('[Renderer Console]', { level, message, line, sourceId });
  });

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    const openDevTools = input.key === 'F12' || (input.control && input.shift && input.key.toUpperCase() === 'I');
    if (openDevTools) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Load app
  if (isDev) {
    console.log('[Electron] Loading dev server:', VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    console.log('[Electron] app.getAppPath():', app.getAppPath());
    console.log('[Electron] process.resourcesPath:', process.resourcesPath);
    loadProductionApp(mainWindow).catch(err => {
      console.error('[Electron] Failed to load production app:', err);
      showStartupError(mainWindow!, 'Failed to load production app', String(err));
    });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', (_, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('notification:show', (_, options: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: path.join(__dirname, '../build/icon.png'),
    });
    notification.show();
  }
});

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('shell:openExternal', (_, url: string) => {
  shell.openExternal(url);
});

// Auto-updater placeholder
// In production, you would add electron-updater here
ipcMain.handle('app:checkForUpdates', async () => {
  return { available: false, version: app.getVersion() };
});

// Handle app protocol (for deep linking)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('connecta', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('connecta');
}

// Handle deep links
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
});

// Secure app
app.on('web-contents-created', (_, contents) => {
  // Disable navigation to external sites in the app
  contents.on('will-navigate', (event, navigationUrl) => {
    if (isDev) {
      const parsedUrl = new URL(navigationUrl);
      // Allow localhost navigation in dev
      if (parsedUrl.origin !== VITE_DEV_SERVER_URL) {
        event.preventDefault();
      }
      return;
    }

    // In production allow app local files, block external web navigation
    const isLocalFile = navigationUrl.startsWith('file://');
    const isAppProtocol = navigationUrl.startsWith('app://');
    const isAboutBlank = navigationUrl === 'about:blank';

    if (!isLocalFile && !isAppProtocol && !isAboutBlank) {
      event.preventDefault();
    }
  });

  // Prevent new window creation
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Cleanup
app.on('before-quit', () => {
  // Save any pending data, close connections, etc.
  console.log('App is quitting...');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
