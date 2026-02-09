import { app, BrowserWindow } from 'electron';
import path from 'path';
import http from 'http';
import { initDatabase, closeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { seedDatabase } from './database/seed';
import { registerAllIpc } from './ipc';

let mainWindow: BrowserWindow | null = null;

function checkViteRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'OnurLtd Market',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');

  if (!app.isPackaged) {
    const viteRunning = await checkViteRunning();
    if (viteRunning) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(indexPath);
    }
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  try {
    // Initialize database (async for sql.js WASM loading)
    const db = await initDatabase();
    runMigrations(db);
    seedDatabase(db);

    // Register IPC handlers
    registerAllIpc();

    // Create window
    createWindow();
  } catch (err) {
    console.error('Failed to initialize application:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
