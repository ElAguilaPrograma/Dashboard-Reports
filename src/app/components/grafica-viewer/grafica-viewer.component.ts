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
  public chartType: 'bar' | 'line' | 'pie' | 'radar' = 'bar';

  private colores = [
    'rgb(59, 130, 246)',  // blue-500
    'rgb(16, 185, 129)',  // green-500
    'rgb(245, 158, 11)',  // amber-500
    'rgb(239, 68, 68)',   // red-500
    'rgb(139, 92, 246)',  // violet-500
    'rgb(236, 72, 153)',  // pink-500
    'rgb(59, 130, 246)',  // cyan-500
    'rgb(168, 85, 247)',  // purple-500
  ];

  public isLoading = false;
  public isFullscreen = false;
  
  ngOnInit() {
    if (!this.grafica) {
      console.error('No se proporcionó una gráfica válida');
      return;
    }
    this.chartType = this.grafica.tipo;
    this.prepararDatos();
    this.configurarOpciones();
  }

  // Métodos auxiliares para el template
  getChartIcon(): string {
    switch (this.grafica.tipo) {
      case 'bar': return 'bar_chart';
      case 'line': return 'show_chart';
      case 'pie': return 'pie_chart';
      case 'radar': return 'radar';
      default: return 'analytics';
    }
  }

  getChartTypeName(): string {
    switch (this.grafica.tipo) {
      case 'bar': return 'Gráfica de Barras';
      case 'line': return 'Gráfica de Líneas';
      case 'pie': return 'Gráfica Circular';
      case 'radar': return 'Gráfica de Radar';
      default: return 'Gráfica';
    }
  }

  getDataPointsCount(): number {
    return this.grafica?.datos?.length || 0;
  }

  exportChart(): void {
    // Implementar exportación de gráfica
    console.log('Exportando gráfica...');
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    // Implementar lógica de pantalla completa
    console.log('Toggle fullscreen:', this.isFullscreen);
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

    // Para gráficas de pastel y radar, solo usamos una serie de datos
    if (this.chartType === 'pie' || this.chartType === 'radar') {
      const dataColumn = this.grafica.columnas[1];
      const data = this.grafica.datos.map(row => {
        const valor = row[dataColumn];
        if (valor === null || valor === undefined || valor === '') {
          return 0;
        }
        const num = Number(valor);
        return !isNaN(num) && isFinite(num) ? num : 0;
      });

      const backgroundColor = this.colores.map((color, idx) => {
        // Convertir RGB a RGBA con transparencia
        return color.replace('rgb(', 'rgba(').replace(')', ', 0.8)');
      });

      this.chartData = {
        labels: labels,
        datasets: [{
          label: this.grafica.columnas[1],
          data: data,
          backgroundColor: backgroundColor,
          borderColor: this.colores,
          borderWidth: 2
        }]
      };
    } else {
      // Para bar y line, usar múltiples series
      const datasets = this.grafica.columnas.slice(1).map((col, index) => {
        const data = this.grafica.datos.map(row => {
          const valor = row[col];
          if (valor === null || valor === undefined || valor === '') {
            return 0;
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
  }

  private configurarOpciones() {
    if (this.chartType === 'pie') {
      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                return label + ': ' + value;
              }
            }
          }
        }
      };
    } else if (this.chartType === 'radar') {
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
          r: {
            beginAtZero: true,
            ticks: {
              precision: 1
            }
          }
        }
      };
    } else {
      // Bar y Line
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
  }

  eliminar() {
    if (confirm('¿Está seguro de eliminar esta gráfica?')) {
      this.onEliminar.emit(this.index);
    }
  }
}

