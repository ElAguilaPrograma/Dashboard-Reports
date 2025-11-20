import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Grafica } from '../../models/informe.model';

@Component({
  selector: 'app-grafica-viewer',
  standalone: false,
  templateUrl: './grafica-viewer.component.html',
  styleUrl: './grafica-viewer.component.css',
})
export class GraficaViewerComponent implements OnInit, AfterViewInit {
  @Input() grafica!: Grafica;
  @Input() index!: number;
  @Output() onEliminar = new EventEmitter<number>();
  @Output() onExpandir = new EventEmitter<{grafica: Grafica, index: number}>();
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

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

  ngAfterViewInit() {
    // Asegurar que el chart esté disponible después de la inicialización de la vista
    setTimeout(() => {
      console.log('Chart después de AfterViewInit:', this.chart);
      console.log('Canvas disponible:', this.chart?.chart?.canvas);
      
      // Verificar que el canvas esté realmente renderizado
      if (this.chart?.chart?.canvas) {
        console.log('Canvas dimensions:', {
          width: this.chart.chart.canvas.width,
          height: this.chart.chart.canvas.height
        });
      }
    }, 500);
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
    console.log('Iniciando exportación de gráfica...');
    this.isLoading = true;
    
    // Método más robusto para obtener el canvas
    this.getChartCanvas().then(canvas => {
      this.isLoading = false;
      if (canvas) {
        try {
          // Crear un enlace para descargar
          const link = document.createElement('a');
          const fileName = `${this.grafica.tituloPersonalizado || this.grafica.nombreExcel || 'grafica'}.png`;
          link.download = fileName;
          
          // Crear la imagen con mejor calidad
          link.href = canvas.toDataURL('image/png', 1.0);
          
          // Agregar el enlace al DOM, hacer clic y removerlo
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('Gráfica exportada exitosamente como:', fileName);
          
          // Mostrar mensaje de éxito al usuario
          const mensaje = `Gráfica descargada como ${fileName}`;
          this.mostrarMensajeExito(mensaje);
          
        } catch (error) {
          console.error('Error al exportar la gráfica:', error);
          alert('Error al exportar la gráfica. Por favor, inténtelo de nuevo.');
        }
      } else {
        console.error('No se pudo acceder al canvas de la gráfica');
        alert('La gráfica aún no está lista para exportar. Por favor, espere un momento e inténtelo de nuevo.');
      }
    }).catch(error => {
      this.isLoading = false;
      console.error('Error al obtener el canvas:', error);
      alert('Error al acceder a la gráfica. Por favor, inténtelo de nuevo.');
    });
  }

  private async getChartCanvas(): Promise<HTMLCanvasElement | null> {
    // Intentar múltiples métodos con reintentos
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(`Intento ${attempt + 1} de obtener canvas...`);
      
      // Método 1: A través de ViewChild
      if (this.chart && this.chart.chart && this.chart.chart.canvas) {
        console.log('Canvas obtenido vía ViewChild');
        return this.chart.chart.canvas;
      }
      
      // Método 2: Buscar directamente en el DOM
      const canvasElement = document.querySelector('.chart-canvas') as HTMLCanvasElement;
      if (canvasElement && canvasElement.tagName === 'CANVAS') {
        console.log('Canvas obtenido vía querySelector');
        return canvasElement;
      }
      
      // Método 3: Buscar por el elemento base-chart
      const baseChartElement = document.querySelector('canvas[baseChart]') as HTMLCanvasElement;
      if (baseChartElement && baseChartElement.tagName === 'CANVAS') {
        console.log('Canvas obtenido vía baseChart selector');
        return baseChartElement;
      }
      
      // Esperar antes del siguiente intento
      if (attempt < 4) {
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
    
    return null;
  }
  
  private mostrarMensajeExito(mensaje: string): void {
    // Crear un elemento temporal para mostrar el mensaje
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  toggleFullscreen(): void {
    // Emitir evento para que el componente padre maneje la expansión
    this.onExpandir.emit({ grafica: this.grafica, index: this.index });
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
    // Opciones base para reducir uso de GPU
    const opcionesBase = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Deshabilitar animaciones para reducir GPU
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          enabled: true
        }
      }
    };

    if (this.chartType === 'pie') {
      this.chartOptions = {
        ...opcionesBase,
        plugins: {
          ...opcionesBase.plugins,
          legend: {
            display: true,
            position: 'right'
          }
        }
      };
    } else if (this.chartType === 'radar') {
      this.chartOptions = {
        ...opcionesBase,
        plugins: {
          ...opcionesBase.plugins,
          legend: {
            display: true,
            position: 'top'
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
        ...opcionesBase,
        plugins: {
          ...opcionesBase.plugins,
          legend: {
            display: true,
            position: 'top'
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

