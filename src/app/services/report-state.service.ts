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
      this.plantasSubject.next(plantasGuardadas);
    } else {
      this.plantasSubject.next(this.generarEstructuraInicial());
    }
  }

  private generarEstructuraInicial(): Planta[] {
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
          titulo: `Nivel ${n}`,
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
}