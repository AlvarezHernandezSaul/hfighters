const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173')
      .catch((err) => console.error('Error al cargar URL en desarrollo:', err));
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
      .catch((err) => console.error('Error al cargar index.html:', err));
    win.webContents.openDevTools(); // Herramientas abiertas para depurar
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Fallo al cargar: ${errorCode} - ${errorDescription}`);
  });

  win.webContents.on('unresponsive', () => {
    console.warn('Renderer se volvió no responsivo');
  });

  win.webContents.on('responsive', () => {
    console.log('Renderer volvió a ser responsivo');
  });

  return win;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});