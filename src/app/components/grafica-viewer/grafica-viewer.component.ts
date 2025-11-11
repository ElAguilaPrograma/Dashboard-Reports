import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { Grafica } from '../../models/informe.model';

@Component({
  selector: 'app-grafica-viewer',
  standalone: false,
  templateUrl: './grafica-viewer.component.html',
  styleUrl: './grafica-viewer.component.css',
})
export class GraficaViewerComponent implements OnInit {
  @Input() grafica!: Grafica;
  @Input() index!: number;
  @Output() onEliminar = new EventEmitter<number>();

  public chartData!: ChartConfiguration['data'];
  public chartOptions: ChartConfiguration['options'];
  public chartType: 'bar' | 'line' = 'bar';

  private colores = [
    'rgb(59, 130, 246)',  // blue-500
    'rgb(16, 185, 129)',  // green-500
    'rgb(245, 158, 11)',  // amber-500
    'rgb(239, 68, 68)',   // red-500
    'rgb(139, 92, 246)',  // violet-500
    'rgb(236, 72, 153)',  // pink-500
  ];

  ngOnInit() {
    this.chartType = this.grafica.tipo;
    this.prepararDatos();
    this.configurarOpciones();
  }

  private prepararDatos() {
    const datasets = this.grafica.columnas.slice(1).map((col, index) => ({
      label: col,
      data: this.grafica.datos.map(row => row[col]),
      backgroundColor: this.chartType === 'bar' 
        ? this.colores[index % this.colores.length]
        : 'transparent',
      borderColor: this.colores[index % this.colores.length],
      borderWidth: 2,
      fill: false
    }));

    this.chartData = {
      labels: this.grafica.datos.map(row => row[this.grafica.columnas[0]]),
      datasets: datasets
    };
  }

  private configurarOpciones() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }

  eliminar() {
    if (confirm('¿Está seguro de eliminar esta gráfica?')) {
      this.onEliminar.emit(this.index);
    }
  }
}
