const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../src/assets/icon.png'), // Icono de la app
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // No mostrar hasta que esté listo
  });

  // Determinar si estamos en desarrollo o producción
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log('Modo de desarrollo:', isDev);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('app.isPackaged:', app.isPackaged);
  
  if (isDev) {
    // En desarrollo - conectar al servidor de Angular
    console.log('Cargando desde servidor de desarrollo...');
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción - cargar archivos estáticos
    const indexPath = path.join(__dirname, '../dist/informe-plantas/browser/index.html');
    console.log('Cargando archivo desde:', indexPath);
    console.log('Archivo existe:', fs.existsSync(indexPath));
    
    mainWindow.loadFile(indexPath);
    
    // Mostrar DevTools temporalmente para depurar
    mainWindow.webContents.openDevTools();
  }

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Error al cargar:', errorCode, errorDescription, validatedURL);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Carga completada exitosamente');
  });
  
  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    console.log('Ventana lista para mostrar');
    mainWindow.show();
    
    // Enfocar la ventana en Windows
    if (process.platform === 'win32') {
      mainWindow.focus();
    }
  });

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
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

// Handler para exportar configuración con diálogo nativo
ipcMain.handle('exportar-configuracion', async (event, { contenido, nombreSugerido }) => {
  const { dialog } = require('electron');
  
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Configuración',
      defaultPath: nombreSugerido,
      filters: [
        { name: 'Archivos de Configuración', extensions: ['json'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, contenido, 'utf8');
      return { success: true, filePath: result.filePath };
    }
    
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});