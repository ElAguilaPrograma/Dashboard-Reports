const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Operaciones de archivo
  guardarInforme: (datos) => ipcRenderer.invoke('guardar-informe', datos),
  cargarInforme: () => ipcRenderer.invoke('cargar-informe'),
  
  // Información del sistema
  platform: process.platform,
  version: process.versions.electron,
  
  // Operaciones de ventana
  minimizar: () => ipcRenderer.invoke('ventana-minimizar'),
  maximizar: () => ipcRenderer.invoke('ventana-maximizar'),
  cerrar: () => ipcRenderer.invoke('ventana-cerrar'),
  
  // Operaciones de archivo del sistema
  mostrarDialogoArchivo: (opciones) => ipcRenderer.invoke('mostrar-dialogo-archivo', opciones),
  mostrarDialogoGuardar: (opciones) => ipcRenderer.invoke('mostrar-dialogo-guardar', opciones),
});

// Prevenir la modificación del objeto expuesto
Object.freeze(window.electronAPI);