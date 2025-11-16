import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Planta, Nivel, SubNivel } from '../models/informe.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ReportStateService {
  private plantasSubject = new BehaviorSubject<Planta[]>([]);
  public plantas$: Observable<Planta[]> = this.plantasSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.inicializar();
  }

  private async inicializar() {
    const plantasGuardadas = await this.storageService.cargarInforme();
    if (plantasGuardadas) {
      // Migrar nombres de niveles si es necesario
      const plantasMigradas = this.migrarNombresNiveles(plantasGuardadas);
      this.plantasSubject.next(plantasMigradas);
    } else {
      this.plantasSubject.next(this.generarEstructuraInicial());
    }
  }

  private migrarNombresNiveles(plantas: Planta[]): Planta[] {
    const nombresNiveles = [
      'Conceptos a evaluar',
      'Capacitación',
      'Condiciones y actos inseguros',
      'Productos quimicos cumplimiento NOM - 018',
      'Ergonomia y manos seguras'
    ];

    return plantas.map(planta => ({
      ...planta,
      niveles: planta.niveles.map((nivel, index) => ({
        ...nivel,
        titulo: nombresNiveles[index] || nivel.titulo || `Nivel ${index + 1}`
      }))
    }));
  }

  private generarEstructuraInicial(): Planta[] {
    const nombresNiveles = [
      'Conceptos a evaluar',
      'Capacitación',
      'Condiciones y actos inseguros',
      'Productos quimicos cumplimiento NOM - 018',
      'Ergonomia y manos seguras'
    ];

    const plantas: Planta[] = [];
    for (let p = 1; p <= 4; p++) {
      const niveles: Nivel[] = [];
      for (let n = 1; n <= 5; n++) {
        const subniveles: SubNivel[] = [];
        for (let s = 1; s <= 5; s++) {
          subniveles.push({
            id: `${n}.${s}`,
            titulo: '',
            descripcion: '',
            archivosExcel: [],
            imagenes: [],
            graficas: []
          });
        }
        niveles.push({
          id: `${n}`,
          titulo: nombresNiveles[n - 1] || `Nivel ${n}`,
          collapsed: true,
          subniveles
        });
      }
      plantas.push({
        id: p,
        nombre: `Planta ${p}`,
        niveles
      });
    }
    return plantas;
  }

  getPlantas(): Planta[] {
    return this.plantasSubject.value;
  }

  actualizarPlantas(plantas: Planta[]) {
    this.plantasSubject.next(plantas);
    this.storageService.guardarInforme(plantas);
  }

  toggleNivel(plantaIndex: number, nivelIndex: number) {
    const plantas = [...this.plantasSubject.value];
    plantas[plantaIndex].niveles[nivelIndex].collapsed = 
      !plantas[plantaIndex].niveles[nivelIndex].collapsed;
    this.actualizarPlantas(plantas);
  }

  actualizarSubnivel(
    plantaIndex: number, 
    nivelIndex: number, 
    subnivelIndex: number, 
    subnivel: SubNivel
  ) {
    const plantas = [...this.plantasSubject.value];
    plantas[plantaIndex].niveles[nivelIndex].subniveles[subnivelIndex] = subnivel;
    this.actualizarPlantas(plantas);
  }

  /**
   * Exporta toda la configuración actual a un archivo
   */
  async exportarConfiguracion(nombreArchivo?: string): Promise<boolean> {
    const plantas = this.getPlantas();
    return await this.storageService.exportarConfiguracion(plantas, nombreArchivo);
  }

  /**
   * Importa configuración desde un archivo y reemplaza la actual
   */
  async importarConfiguracion(archivo: File): Promise<{ success: boolean; error?: string }> {
    const result = await this.storageService.importarConfiguracion(archivo);
    
    if (result.success && result.plantas) {
      // Migrar nombres de niveles si es necesario
      const plantasMigradas = this.migrarNombresNiveles(result.plantas);
      this.actualizarPlantas(plantasMigradas);
      return { success: true };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Importa configuración mezclando con la actual (sin reemplazar)
   */
  async importarYMezclarConfiguracion(archivo: File): Promise<{ success: boolean; error?: string }> {
    const result = await this.storageService.importarConfiguracion(archivo);
    
    if (result.success && result.plantas) {
      const plantasActuales = [...this.getPlantas()];
      const plantasImportadas = this.migrarNombresNiveles(result.plantas);
      
      // Mezclar datos: mantener estructura actual pero añadir contenido importado
      plantasImportadas.forEach((plantaImportada, plantaIndex) => {
        if (plantaIndex < plantasActuales.length) {
          plantaImportada.niveles.forEach((nivelImportado, nivelIndex) => {
            if (nivelIndex < plantasActuales[plantaIndex].niveles.length) {
              nivelImportado.subniveles.forEach((subnivelImportado, subnivelIndex) => {
                if (subnivelIndex < plantasActuales[plantaIndex].niveles[nivelIndex].subniveles.length) {
                  const subnivelActual = plantasActuales[plantaIndex].niveles[nivelIndex].subniveles[subnivelIndex];
                  
                  // Mezclar contenido
                  if (subnivelImportado.archivosExcel?.length) {
                    subnivelActual.archivosExcel = [...(subnivelActual.archivosExcel || []), ...subnivelImportado.archivosExcel];
                  }
                  if (subnivelImportado.imagenes?.length) {
                    subnivelActual.imagenes = [...(subnivelActual.imagenes || []), ...subnivelImportado.imagenes];
                  }
                  if (subnivelImportado.graficas?.length) {
                    subnivelActual.graficas = [...(subnivelActual.graficas || []), ...subnivelImportado.graficas];
                  }
                  if (subnivelImportado.tarjetasTexto?.length) {
                    subnivelActual.tarjetasTexto = [...(subnivelActual.tarjetasTexto || []), ...subnivelImportado.tarjetasTexto];
                  }
                }
              });
            }
          });
        }
      });
      
      this.actualizarPlantas(plantasActuales);
      return { success: true };
    }
    
    return { success: false, error: result.error };
  }
}