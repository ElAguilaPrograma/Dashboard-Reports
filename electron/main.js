const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // En desarrollo
  mainWindow.loadURL('http://localhost:4200');
  
  // En producción
  // mainWindow.loadFile(path.join(__dirname, '../dist/informe-plantas/browser/index.html'));

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers para guardar/cargar datos
const dataPath = path.join(app.getPath('userData'), 'informes.json');

ipcMain.handle('guardar-informe', (event, datos) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(datos, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cargar-informe', () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});