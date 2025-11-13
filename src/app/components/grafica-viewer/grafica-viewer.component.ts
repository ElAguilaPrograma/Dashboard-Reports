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
    if (!this.grafica) {
      console.error('No se proporcionó una gráfica válida');
      return;
    }
    this.chartType = this.grafica.tipo;
    this.prepararDatos();
    this.configurarOpciones();
  }

  private prepararDatos() {
    if (!this.grafica || !this.grafica.datos || this.grafica.datos.length === 0) {
      console.error('No hay datos para la gráfica');
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    if (!this.grafica.columnas || this.grafica.columnas.length < 2) {
      console.error('No hay suficientes columnas para la gráfica');
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Primera columna es para los labels
    const labelColumn = this.grafica.columnas[0];
    const labels = this.grafica.datos.map(row => {
      const label = row[labelColumn];
      return label !== null && label !== undefined ? String(label) : '';
    });

    // Resto de columnas son para los datos
    const datasets = this.grafica.columnas.slice(1).map((col, index) => {
      const data = this.grafica.datos.map(row => {
        const valor = row[col];
        // Convertir a número si es posible
        if (valor === null || valor === undefined || valor === '') {
          return 0; // Usar 0 en lugar de null para mantener la longitud
        }
        const num = Number(valor);
        return !isNaN(num) && isFinite(num) ? num : 0;
      });

      return {
        label: col,
        data: data,
        backgroundColor: this.chartType === 'bar' 
          ? this.colores[index % this.colores.length] + '80' // Agregar transparencia
          : 'transparent',
        borderColor: this.colores[index % this.colores.length],
        borderWidth: 2,
        fill: this.chartType === 'line' ? false : undefined,
        tension: this.chartType === 'line' ? 0.4 : undefined
      };
    });

    this.chartData = {
      labels: labels,
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
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 2
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
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
