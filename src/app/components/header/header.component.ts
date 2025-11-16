import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { ReportStateService } from '../../services/report-state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  sidebarVisible$: Observable<boolean>;
  
  constructor(
    private sidebarService: SidebarService,
    private reportService: ReportStateService
  ) {
    this.sidebarVisible$ = this.sidebarService.sidebarVisible$;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  async exportarConfiguracion() {
    try {
      const nombreArchivo = `configuracion-radar-${new Date().toISOString().split('T')[0]}.json`;
      const success = await this.reportService.exportarConfiguracion(nombreArchivo);
      
      if (success) {
        this.mostrarMensajeExito('Configuración exportada exitosamente');
      } else {
        alert('Error al exportar la configuración');
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      alert('Error al exportar la configuración');
    }
  }

  importarConfiguracion() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;

    input.onchange = async (event: any) => {
      const archivo = event.target.files[0];
      if (!archivo) return;

      if (!confirm('¿Estás seguro? Esto reemplazará toda la configuración actual.')) {
        return;
      }

      try {
        const result = await this.reportService.importarConfiguracion(archivo);
        
        if (result.success) {
          this.mostrarMensajeExito('Configuración importada exitosamente. Todos los datos han sido reemplazados.');
          // Recargar página para refrescar todo
          window.location.reload();
        } else {
          alert('Error al importar: ' + (result.error || 'Archivo inválido'));
        }
      } catch (error) {
        console.error('Error en importación:', error);
        alert('Error al procesar el archivo de configuración');
      }
    };

    input.click();
  }

  importarYMezclar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;

    input.onchange = async (event: any) => {
      const archivo = event.target.files[0];
      if (!archivo) return;

      try {
        const result = await this.reportService.importarYMezclarConfiguracion(archivo);
        
        if (result.success) {
          this.mostrarMensajeExito('Configuración mezclada exitosamente. El contenido se ha añadido a los datos existentes.');
          // Recargar página para refrescar todo
          window.location.reload();
        } else {
          alert('Error al importar: ' + (result.error || 'Archivo inválido'));
        }
      } catch (error) {
        console.error('Error en importación:', error);
        alert('Error al procesar el archivo de configuración');
      }
    };

    input.click();
  }

  private mostrarMensajeExito(mensaje: string) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}
