const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

let mainWindow;
let indexPath; // Variable para almacenar la ruta del index

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
    // Ocultar la barra de menú nativa por defecto
    autoHideMenuBar: true,
    show: false // No mostrar hasta que esté listo
  });

  // Quitar menú de aplicación completamente (evita que Alt lo muestre)
  try {
    Menu.setApplicationMenu(null);
    if (mainWindow.removeMenu) mainWindow.removeMenu();
    if (mainWindow.setMenuBarVisibility) mainWindow.setMenuBarVisibility(false);
  } catch (e) {
    console.warn('No se pudo eliminar el menú:', e && e.message ? e.message : e);
  }

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
    // Intentar varias rutas comunes donde Angular puede haber colocado el build
    const possibleIndexPaths = [
      path.join(__dirname, '../dist/informe-plantas/browser/index.html'),
      path.join(__dirname, '../dist/informe-plantas/index.html')
    ];

    indexPath = possibleIndexPaths.find(p => fs.existsSync(p));
    if (!indexPath) {
      // Ruta por defecto (fallback)
      indexPath = path.join(__dirname, '../dist/informe-plantas/browser/index.html');
    }

    console.log('Cargando archivo desde (seleccionado):', indexPath);
    console.log('Archivo existe:', fs.existsSync(indexPath));

    try {
      // Método tradicional con file://
      const fileUrl = url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true
      });
      console.log('URL de carga:', fileUrl);
      mainWindow.loadURL(fileUrl);
    } catch (err) {
      console.error('Error al cargar archivo estático:', err);
    }

    // Abrir DevTools solo si se activó por depuración (se puede comentar en producción)
    // mainWindow.webContents.openDevTools();
  }

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Error al cargar:', errorCode, errorDescription, validatedURL);
    
    // Si falla la carga en producción, intentar recargar el index.html principal
    if (!isDev && indexPath && errorCode !== -3) { // -3 es ERR_ABORTED (normal)
      console.log('Intentando restaurar aplicación...');
      setTimeout(() => {
        const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
        mainWindow.loadURL(fileUrl);
      }, 100);
    }
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

  // SOLUCIÓN: Interceptar navegación y prevenir recarga en blanco
  // Esto evita que la aplicación se quede en blanco al recargar
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isDev) {
      // Obtener la URL actual
      const currentURL = mainWindow.webContents.getURL();
      
      // Solo permitir navegación hash dentro de la misma página
      const currentBase = currentURL.split('#')[0];
      const newBase = url.split('#')[0];
      
      // Si intentan navegar a diferente archivo, prevenir
      if (currentBase !== newBase) {
        event.preventDefault();
        console.log('Navegación a diferente página bloqueada:', url);
      }
    }
  });

  // Interceptar nuevas ventanas y redirigir al navegador externo
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Interceptar cualquier intento de recarga de página
  mainWindow.webContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
    if (!isDev && isMainFrame) {
      const currentURL = mainWindow.webContents.getURL();
      const isHashChange = url.includes('#') && url.startsWith('file://');
      
      // Si no es un cambio de hash y no es la URL actual, algo anda mal
      if (!isHashChange && url !== currentURL && !url.includes(indexPath)) {
        console.log('Navegación sospechosa detectada:', url);
      }
    }
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