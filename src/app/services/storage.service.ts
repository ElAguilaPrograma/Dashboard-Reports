import { Injectable } from '@angular/core';
import { Planta } from '../models/informe.model';

declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  async guardarInforme(plantas: Planta[]): Promise<boolean> {
    if (window.require) {
      // Modo Electron
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('guardar-informe', plantas);
      return result.success;
    } else {
      // Fallback localStorage (para desarrollo web)
      localStorage.setItem('informes_plantas', JSON.stringify(plantas));
      return true;
    }
  }

  async cargarInforme(): Promise<Planta[] | null> {
    if (window.require) {
      // Modo Electron
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('cargar-informe');
      return result.success ? result.data : null;
    } else {
      // Fallback localStorage
      const data = localStorage.getItem('informes_plantas');
      return data ? JSON.parse(data) : null;
    }
  }
}