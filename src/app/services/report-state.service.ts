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
      
      console.log('Mezclando configuración...');
      console.log('Plantas actuales:', plantasActuales.length);
      console.log('Plantas importadas:', plantasImportadas.length);
      
      let totalElementosMezclados = 0;
      
      // Mezclar datos: mantener estructura actual pero añadir contenido importado
      plantasImportadas.forEach((plantaImportada, plantaIndex) => {
        if (plantaIndex < plantasActuales.length) {
          plantaImportada.niveles.forEach((nivelImportado, nivelIndex) => {
            if (nivelIndex < plantasActuales[plantaIndex].niveles.length) {
              nivelImportado.subniveles.forEach((subnivelImportado, subnivelIndex) => {
                if (subnivelIndex < plantasActuales[plantaIndex].niveles[nivelIndex].subniveles.length) {
                  const subnivelActual = plantasActuales[plantaIndex].niveles[nivelIndex].subniveles[subnivelIndex];
                  
                  let elementosEnEsteSubnivel = 0;
                  
                  // Mezclar archivos Excel
                  if (subnivelImportado.archivosExcel && subnivelImportado.archivosExcel.length > 0) {
                    if (!subnivelActual.archivosExcel) {
                      subnivelActual.archivosExcel = [];
                    }
                    // Añadir timestamp único para evitar duplicados
                    const archivosConTimestamp = subnivelImportado.archivosExcel.map(archivo => ({
                      ...archivo,
                      timestamp: Date.now() + Math.random()
                    }));
                    subnivelActual.archivosExcel.push(...archivosConTimestamp);
                    elementosEnEsteSubnivel += subnivelImportado.archivosExcel.length;
                    console.log(`Mezclados ${subnivelImportado.archivosExcel.length} archivos Excel en P${plantaIndex+1}-N${nivelIndex+1}-S${subnivelIndex+1}`);
                  }
                  
                  // Mezclar imágenes
                  if (subnivelImportado.imagenes && subnivelImportado.imagenes.length > 0) {
                    if (!subnivelActual.imagenes) {
                      subnivelActual.imagenes = [];
                    }
                    subnivelActual.imagenes.push(...subnivelImportado.imagenes);
                    elementosEnEsteSubnivel += subnivelImportado.imagenes.length;
                    console.log(`Mezcladas ${subnivelImportado.imagenes.length} imágenes en P${plantaIndex+1}-N${nivelIndex+1}-S${subnivelIndex+1}`);
                  }
                  
                  // Mezclar gráficas
                  if (subnivelImportado.graficas && subnivelImportado.graficas.length > 0) {
                    if (!subnivelActual.graficas) {
                      subnivelActual.graficas = [];
                    }
                    // Añadir timestamp único para evitar duplicados
                    const graficasConTimestamp = subnivelImportado.graficas.map(grafica => ({
                      ...grafica,
                      timestamp: Date.now() + Math.random()
                    }));
                    subnivelActual.graficas.push(...graficasConTimestamp);
                    elementosEnEsteSubnivel += subnivelImportado.graficas.length;
                    console.log(`Mezcladas ${subnivelImportado.graficas.length} gráficas en P${plantaIndex+1}-N${nivelIndex+1}-S${subnivelIndex+1}`);
                  }
                  
                  // Mezclar tarjetas de texto
                  if (subnivelImportado.tarjetasTexto && subnivelImportado.tarjetasTexto.length > 0) {
                    if (!subnivelActual.tarjetasTexto) {
                      subnivelActual.tarjetasTexto = [];
                    }
                    // Añadir timestamp único para evitar duplicados
                    const textosConTimestamp = subnivelImportado.tarjetasTexto.map(texto => ({
                      ...texto,
                      timestamp: Date.now() + Math.random()
                    }));
                    subnivelActual.tarjetasTexto.push(...textosConTimestamp);
                    elementosEnEsteSubnivel += subnivelImportado.tarjetasTexto.length;
                    console.log(`Mezcladas ${subnivelImportado.tarjetasTexto.length} tarjetas de texto en P${plantaIndex+1}-N${nivelIndex+1}-S${subnivelIndex+1}`);
                  }
                  
                  totalElementosMezclados += elementosEnEsteSubnivel;
                }
              });
            }
          });
        }
      });
      
      console.log(`Total de elementos mezclados: ${totalElementosMezclados}`);
      
      if (totalElementosMezclados > 0) {
        this.actualizarPlantas(plantasActuales);
        console.log('Configuración mezclada exitosamente');
        return { success: true };
      } else {
        return { success: false, error: 'No se encontraron elementos para mezclar en el archivo importado' };
      }
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Limpia completamente todo el entorno, eliminando todos los datos
   */
  limpiarTodoElEntorno(): boolean {
    try {
      // Regenerar estructura inicial completamente limpia
      const plantasLimpias = this.generarEstructuraInicial();
      this.actualizarPlantas(plantasLimpias);
      return true;
    } catch (error) {
      console.error('Error al limpiar entorno:', error);
      return false;
    }
  }
}