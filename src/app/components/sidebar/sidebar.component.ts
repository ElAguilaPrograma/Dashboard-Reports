import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Planta } from '../../models/informe.model';
import { SidebarService } from '../../services/sidebar.service';
import { DialogEditarNombrePlantaComponent, DialogEditarNombrePlantaData } from '../dialog-editar-nombre-planta/dialog-editar-nombre-planta.component';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() plantas: Planta[] = [];
  @Input() plantaActiva: number = 0;
  @Input() subnivelSeleccionado: { nivelIndex: number; subnivelIndex: number } | null = null;

  @Output() plantaActivaChange = new EventEmitter<number>();
  @Output() toggleNivelEvent = new EventEmitter<number>();
  @Output() seleccionarSubnivelEvent = new EventEmitter<{ nivelIndex: number; subnivelIndex: number }>();
  @Output() editarNombrePlantaEvent = new EventEmitter<{ plantaIndex: number; nombrePersonalizado: string | null }>();

  sidebarVisible$: Observable<boolean>;

  constructor(
    private sidebarService: SidebarService,
    private dialog: MatDialog
  ) {
    this.sidebarVisible$ = this.sidebarService.sidebarVisible$;
  }

  ngOnInit() {}

  onPlantaClick(index: number) {
    this.plantaActivaChange.emit(index);
  }

  onToggleNivel(nivelIndex: number) {
    this.toggleNivelEvent.emit(nivelIndex);
  }

  onSeleccionarSubnivel(nivelIndex: number, subnivelIndex: number) {
    this.seleccionarSubnivelEvent.emit({ nivelIndex, subnivelIndex });
  }

  onEditarNombrePlanta(event: Event, plantaIndex: number) {
    event.stopPropagation(); // Evitar que active el click de la planta
    
    const planta = this.plantas[plantaIndex];
    if (!planta) return;

    const dialogRef = this.dialog.open(DialogEditarNombrePlantaComponent, {
      width: '500px',
      data: {
        nombreActual: planta.nombre,
        nombrePersonalizado: planta.nombrePersonalizado
      } as DialogEditarNombrePlantaData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        // result puede ser string (nuevo nombre) o null (restaurar original)
        this.editarNombrePlantaEvent.emit({ 
          plantaIndex, 
          nombrePersonalizado: result 
        });
      }
    });
  }

  getNombrePlanta(planta: Planta): string {
    return planta.nombrePersonalizado || planta.nombre;
  }
}