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

  /**
   * Exporta la configuración completa a un archivo JSON
   */
  async exportarConfiguracion(plantas: Planta[], nombreArchivo?: string): Promise<boolean> {
    try {
      const configCompleta = {
        version: '1.0',
        fechaExportacion: new Date().toISOString(),
        aplicacion: 'Radar - Seguridad y Ergonomia',
        totalPlantas: plantas.length,
        plantas: plantas,
        metadatos: {
          totalTablas: this.contarElementos(plantas, 'archivosExcel'),
          totalImagenes: this.contarElementos(plantas, 'imagenes'),
          totalGraficas: this.contarElementos(plantas, 'graficas'),
          totalTextos: this.contarElementos(plantas, 'tarjetasTexto'),
          // totalCollages: this.contarElementos(plantas, 'collages') // Comentado porque collages no existe en el modelo actual
        }
      };

      const jsonContent = JSON.stringify(configCompleta, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      if (window.require) {
        // Modo Electron - usar diálogo nativo
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('exportar-configuracion', {
          contenido: jsonContent,
          nombreSugerido: nombreArchivo || `configuracion-radar-${new Date().toISOString().split('T')[0]}.json`
        });
        return result.success;
      } else {
        // Modo web - descarga directa
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo || `configuracion-radar-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
    } catch (error) {
      console.error('Error al exportar configuración:', error);
      return false;
    }
  }

  /**
   * Importa configuración desde un archivo JSON
   */
  async importarConfiguracion(archivo: File): Promise<{ success: boolean; plantas?: Planta[]; error?: string }> {
    try {
      const contenido = await this.leerArchivoTexto(archivo);
      const configuracion = JSON.parse(contenido);
      
      // Validar estructura del archivo
      if (!this.validarConfiguracion(configuracion)) {
        return { success: false, error: 'El archivo no tiene el formato correcto de configuración' };
      }
      
      // Verificar compatibilidad de versión
      if (configuracion.version !== '1.0') {
        console.warn('Versión de configuración diferente:', configuracion.version);
      }
      
      return { success: true, plantas: configuracion.plantas };
    } catch (error) {
      console.error('Error al importar configuración:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: 'Error al procesar el archivo: ' + errorMessage };
    }
  }

  /**
   * Lee un archivo como texto
   */
  private leerArchivoTexto(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
      reader.readAsText(archivo);
    });
  }

  /**
   * Valida la estructura de una configuración importada
   */
  private validarConfiguracion(config: any): boolean {
    return config &&
           typeof config === 'object' &&
           config.plantas &&
           Array.isArray(config.plantas) &&
           config.version &&
           config.fechaExportacion;
  }

  /**
   * Cuenta elementos de un tipo específico en todas las plantas
   */
  private contarElementos(plantas: Planta[], tipoElemento: string): number {
    let total = 0;
    plantas.forEach(planta => {
      planta.niveles.forEach(nivel => {
        nivel.subniveles.forEach(subnivel => {
          const elementos = (subnivel as any)[tipoElemento];
          if (Array.isArray(elementos)) {
            total += elementos.length;
          }
        });
      });
    });
    return total;
  }
}