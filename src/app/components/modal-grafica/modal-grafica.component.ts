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

  getColumnType(index: number): string {
    if (!this.excel?.datos || this.excel.datos.length < 2) {
      return 'texto';
    }
    
    const sampleValue = this.excel.datos[1][index];
    if (sampleValue === undefined || sampleValue === null || sampleValue === '') {
      return 'vacío';
    }
    
    // Verificar si es número
    if (!isNaN(Number(sampleValue)) && isFinite(Number(sampleValue))) {
      return 'número';
    }
    
    // Verificar si es fecha
    const dateValue = new Date(sampleValue);
    if (!isNaN(dateValue.getTime()) && sampleValue.toString().match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/)) {
      return 'fecha';
    }
    
    return 'texto';
  }

  getColumnIcon(index: number): string {
    const type = this.getColumnType(index);
    switch (type) {
      case 'número':
        return 'tag';
      case 'fecha':
        return 'event';
      case 'vacío':
        return 'help_outline';
      default:
        return 'text_fields';
    }
  }

  crearGrafica() {
    console.log('Modal: Crear gráfica solicitada');
    console.log('Datos del Excel:', this.excel);
    console.log('Columnas seleccionadas:', this.columnasSeleccionadas);
    console.log('Tipo de gráfica:', this.tipoGrafica);
    
    // Para gráficas de pastel y radar, solo necesitamos 2 columnas (etiqueta + datos)
    // Para bar y line, necesitamos al menos 2 columnas
    if (this.columnasSeleccionadas.length < 2) {
      alert('Debe seleccionar al menos 2 columnas');
      return;
    }
    
    const config = {
      excelIndex: this.excelIndex,
      tipo: this.tipoGrafica,
      columnas: this.columnasSeleccionadas
    };
    
    console.log('Modal: Emitiendo configuración:', config);
    this.onCrear.emit(config);
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

