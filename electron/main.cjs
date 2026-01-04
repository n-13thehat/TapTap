/* Electron main for TapTap Matrix (dev + packaged) */
const { app, BrowserWindow, session, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

// Set app metadata
app.setName("TapTap Matrix");
app.setVersion("1.0.0");

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

const isProd = app.isPackaged;
const DEV_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const PROD_PORT = process.env.PORT || 5757;

let win;
let serverProc;

function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const sock = net.createConnection({ port }, () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error("Server not responding"));
        }
        setTimeout(tryOnce, 250);
      });
    })();
  });
}

async function ensureServer() {
  if (!isProd) return DEV_URL;

  const srvDir = path.join(process.resourcesPath, "app-server");
  const serverJs = path.join(srvDir, "server.js");
  const nodePath = process.execPath;

  if (!serverProc) {
    serverProc = spawn(nodePath, [serverJs], {
      cwd: srvDir,
      env: {
        ...process.env,
        PORT: String(PROD_PORT),
        NODE_ENV: "production",
      },
      stdio: "ignore",
      windowsHide: true,
    });
  }

  await waitForPort(PROD_PORT, 20000);
  return `http://localhost:${PROD_PORT}`;
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: "#000000",
    title: "TapTap Matrix",
    icon: path.join(__dirname, "../public/branding/tap-logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools();
    }
  });

  const url = await ensureServer();
  // Load the TapTap Matrix home page
  console.log('🌐 Loading URL:', url.replace(/\/$/, "") + "/home");
  try {
    await win.loadURL(url.replace(/\/$/, "") + "/home");
    console.log('✅ Page loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load page:', error);
    // Fallback to localhost if URL fails
    try {
      await win.loadURL("http://localhost:3000/home");
      console.log('✅ Fallback URL loaded successfully');
    } catch (fallbackError) {
      console.error('❌ Fallback URL also failed:', fallbackError);
    }
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  // Add error handling
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  app.whenReady().then(async () => {
    try {
      const filter = { urls: ["http://localhost:*/*", "https://*/*"] };
      session.defaultSession.webRequest.onHeadersReceived(filter, (details, cb) => {
        cb({
          responseHeaders: {
            ...details.responseHeaders,
            "Access-Control-Allow-Origin": ["*"],
          },
        });
      });
    } catch (err) {
      // best-effort CORS relaxation; safe to ignore
    }

    // Set up application menu
    const template = [
      {
        label: 'TapTap Matrix',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
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
          { role: 'selectall' }
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
          { role: 'close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    await createWindow();
    console.log('✅ Electron app started successfully');

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
