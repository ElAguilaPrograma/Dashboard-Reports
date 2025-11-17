import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Planta } from '../../models/informe.model';
import { SidebarService } from '../../services/sidebar.service';

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

  sidebarVisible$: Observable<boolean>;

  constructor(private sidebarService: SidebarService) {
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
}