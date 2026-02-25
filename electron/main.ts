import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

// Mitigates black screen issues on some Windows GPU drivers
app.disableHardwareAcceleration();

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: true,
    backgroundColor: '#0A0A0C',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
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

  // Load app
  if (isDev) {
    console.log('[Electron] Loading dev server:', VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // In production, files are in resources/app.asar or resources/app
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[Electron] Loading production file:', indexPath);
    console.log('[Electron] app.getAppPath():', app.getAppPath());
    console.log('[Electron] process.resourcesPath:', process.resourcesPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('[Electron] Failed to load index.html:', err);
      // Fallback: try alternative paths
      const altPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
      console.log('[Electron] Trying alternative path:', altPath);
      mainWindow?.loadFile(altPath).catch(err2 => {
        console.error('[Electron] Alternative path also failed:', err2);
      });
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
