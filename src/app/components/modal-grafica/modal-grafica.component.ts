import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArchivoExcel } from '../../models/informe.model';

@Component({
  selector: 'app-modal-grafica',
  standalone: false,
  templateUrl: './modal-grafica.component.html',
  styleUrl: './modal-grafica.component.css'
})
export class ModalGraficaComponent {
  @Input() excel: ArchivoExcel | null = null;
  @Input() excelIndex: number = 0;
  @Output() onCrear = new EventEmitter<{
    excelIndex: number;
    tipo: 'bar' | 'line' | 'pie' | 'radar';
    columnas: number[];
  }>();
  @Output() onCerrar = new EventEmitter<void>();

  tipoGrafica: 'bar' | 'line' | 'pie' | 'radar' = 'bar';
  columnasSeleccionadas: number[] = [0, 1];

  get headers(): string[] {
    return this.excel?.datos[0] || [];
  }

  toggleColumna(index: number) {
    const idx = this.columnasSeleccionadas.indexOf(index);
    if (idx > -1) {
      this.columnasSeleccionadas.splice(idx, 1);
    } else {
      this.columnasSeleccionadas.push(index);
    }
  }

  isColumnSelected(index: number): boolean {
    return this.columnasSeleccionadas.includes(index);
  }

  crearGrafica() {
    // Para gráficas de pastel y radar, solo necesitamos 2 columnas (etiqueta + datos)
    // Para bar y line, necesitamos al menos 2 columnas
    if (this.columnasSeleccionadas.length < 2) {
      alert('Debe seleccionar al menos 2 columnas');
      return;
    }
    this.onCrear.emit({
      excelIndex: this.excelIndex,
      tipo: this.tipoGrafica,
      columnas: this.columnasSeleccionadas
    });
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

