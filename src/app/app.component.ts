import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReportStateService } from './services/report-state.service';
import { ExcelService } from './services/excel.service';
import { Planta, SubNivel } from './models/informe.model';
import { DialogNombreExcelComponent, DialogNombreExcelData } from './components/dialog-nombre-excel/dialog-nombre-excel.component';
import { DialogNombreImagenComponent, DialogNombreImagenData } from './components/dialog-nombre-imagen/dialog-nombre-imagen.component';
import { DialogNombreGraficaComponent, DialogNombreGraficaData } from './components/dialog-nombre-grafica/dialog-nombre-grafica.component';
import { DialogCollageComponent, DialogCollageData } from './components/dialog-collage/dialog-collage.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  plantas: Planta[] = [];
  plantaActiva = 0;
  subnivelSeleccionado: { nivelIndex: number; subnivelIndex: number } | null = null;
  subnivelActual: SubNivel | null = null;

  mostrarModalGrafica = false;
  excelIndexSeleccionado = 0;

  // Datos temporales para modales
  archivoExcelTemporal: any = null;
  archivosImagenesTemporales: any[] = [];
  configGraficaTemporal: any = null;

  constructor(
    private reportService: ReportStateService,
    private excelService: ExcelService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.reportService.plantas$.subscribe(plantas => {
      this.plantas = plantas;
      this.actualizarSubnivelActual();
    });
  }

  toggleNivel(nivelIndex: number) {
    this.reportService.toggleNivel(this.plantaActiva, nivelIndex);
  }

  seleccionarSubnivel(nivelIndex: number, subnivelIndex: number) {
    this.subnivelSeleccionado = { nivelIndex, subnivelIndex };
    this.actualizarSubnivelActual();
  }

  private actualizarSubnivelActual() {
    if (this.subnivelSeleccionado && this.plantas[this.plantaActiva]) {
      this.subnivelActual = this.plantas[this.plantaActiva]
        .niveles[this.subnivelSeleccionado.nivelIndex]
        .subniveles[this.subnivelSeleccionado.subnivelIndex];
    }
  }

  async onExcelSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.subnivelActual) {
      try {
        const excel = await this.excelService.leerExcel(file);
        this.archivoExcelTemporal = excel;
        
        const dialogRef = this.dialog.open(DialogNombreExcelComponent, {
          width: '400px',
          data: {
            nombreSugerido: file.name.replace(/\.[^/.]+$/, '')
          } as DialogNombreExcelData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && this.archivoExcelTemporal && this.subnivelActual) {
            // Agregar timestamp y nombre personalizado
            (this.archivoExcelTemporal as any).timestamp = Date.now();
            (this.archivoExcelTemporal as any).tituloPersonalizado = result;
            this.subnivelActual.archivosExcel.push(this.archivoExcelTemporal);
            this.guardarCambios();
            this.archivoExcelTemporal = null;
          } else {
            this.archivoExcelTemporal = null;
          }
        });
      } catch (error) {
        alert('Error al cargar Excel: ' + error);
      }
    }
    event.target.value = '';
  }

  async onImagenesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (this.subnivelActual && files.length > 0) {
      try {
        // Cargar todas las imágenes primero
        this.archivosImagenesTemporales = [];
        const timestampBase = Date.now();
        
        for (let i = 0; i < files.length; i++) {
          const datos = await this.excelService.leerImagen(files[i]);
          const imagen: any = { 
            nombre: files[i].name, 
            datos,
            timestamp: timestampBase + i,
            fileIndex: i
          };
          this.archivosImagenesTemporales.push(imagen);
        }
        
        const nombreSugerido = files.length === 1 
          ? files[0].name.replace(/\.[^/.]+$/, '')
          : 'Galería de imágenes';
        
        const dialogRef = this.dialog.open(DialogNombreImagenComponent, {
          width: '400px',
          data: {
            nombreSugerido: nombreSugerido,
            cantidadImagenes: files.length
          } as DialogNombreImagenData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && this.subnivelActual && this.archivosImagenesTemporales.length > 0) {
            if (result.crearCollage && this.archivosImagenesTemporales.length > 1) {
              // Crear collage
              const collage: any = {
                tipo: 'collage',
                titulo: result.nombre,
                imagenes: this.archivosImagenesTemporales.map(img => ({
                  nombre: img.nombre,
                  datos: img.datos
                })),
                timestamp: Date.now()
              };
              
              if (!(this.subnivelActual as any).collages) {
                (this.subnivelActual as any).collages = [];
              }
              (this.subnivelActual as any).collages.push(collage);
            } else {
              // Insertar imágenes individualmente
              this.archivosImagenesTemporales.forEach((imagen, index) => {
                const nombreFinal = this.archivosImagenesTemporales.length === 1 
                  ? result.nombre
                  : `${result.nombre} ${index + 1}`;
                (imagen as any).tituloPersonalizado = nombreFinal;
                this.subnivelActual!.imagenes.push(imagen);
              });
            }
            
            this.guardarCambios();
            this.archivosImagenesTemporales = [];
          } else {
            this.archivosImagenesTemporales = [];
          }
        });
      } catch (error) {
        console.error('Error al cargar imagen:', error);
        alert('Error al cargar imágenes');
      }
    }
    event.target.value = '';
  }

  eliminarImagen(index: number) {
    if (this.subnivelActual) {
      this.subnivelActual.imagenes.splice(index, 1);
      this.guardarCambios();
    }
  }

  eliminarExcel(index: number) {
    if (this.subnivelActual) {
      this.subnivelActual.archivosExcel.splice(index, 1);
      this.guardarCambios();
    }
  }

  guardarCambios() {
    if (this.subnivelSeleccionado && this.subnivelActual) {
      this.reportService.actualizarSubnivel(
        this.plantaActiva,
        this.subnivelSeleccionado.nivelIndex,
        this.subnivelSeleccionado.subnivelIndex,
        this.subnivelActual
      );
    }
  }

  abrirModalGrafica(excelIndex: number) {
    this.excelIndexSeleccionado = excelIndex;
    this.mostrarModalGrafica = true;
  }

  cerrarModalGrafica() {
    this.mostrarModalGrafica = false;
  }

  crearGrafica(config: { excelIndex: number; tipo: 'bar' | 'line'; columnas: number[] }) {
    if (!this.subnivelActual) return;

    const excel = this.subnivelActual.archivosExcel[config.excelIndex];
    if (!excel || !excel.datos || excel.datos.length === 0) {
      alert('Error: El archivo Excel no tiene datos válidos');
      return;
    }

    const headers = excel.datos[0];
    const filas = excel.datos.slice(1).filter(fila => fila && fila.length > 0); // Filtrar filas vacías

    if (filas.length === 0) {
      alert('Error: No hay datos válidos en el archivo Excel');
      return;
    }

    // Función auxiliar para convertir valores a números cuando sea posible
    const convertirValor = (valor: any): any => {
      if (valor === null || valor === undefined || valor === '') {
        return null;
      }
      // Intentar convertir a número
      const num = Number(valor);
      if (!isNaN(num) && isFinite(num)) {
        return num;
      }
      // Si no es número, devolver el valor original (para labels)
      return valor;
    };

    const datosGrafica = filas.map(fila => {
      const obj: any = {};
      config.columnas.forEach(colIndex => {
        const header = headers[colIndex];
        const valor = fila[colIndex];
        // La primera columna se mantiene como string (label), las demás se convierten a número
        if (colIndex === config.columnas[0]) {
          obj[header] = valor !== null && valor !== undefined ? String(valor) : '';
        } else {
          obj[header] = convertirValor(valor);
        }
      });
      return obj;
    });

    // Validar que hay datos válidos
    const primeraColumna = headers[config.columnas[0]];
    const datosValidos = datosGrafica.filter(row => {
      // Verificar que al menos una columna de datos (no la primera) tenga valores numéricos
      return config.columnas.slice(1).some(colIndex => {
        const header = headers[colIndex];
        return row[header] !== null && row[header] !== undefined && typeof row[header] === 'number';
      });
    });

    if (datosValidos.length === 0) {
      alert('Error: No se encontraron datos numéricos válidos en las columnas seleccionadas');
      return;
    }

    // Guardar configuración temporalmente y pedir nombre
    this.configGraficaTemporal = {
      tipo: config.tipo,
      datos: datosValidos,
      columnas: config.columnas.map(i => headers[i]),
      excelIndex: config.excelIndex,
      nombreExcel: excel.nombre || (excel as any).tituloPersonalizado || 'Gráfica'
    };
    const nombreSugerido = `Gráfica de ${this.configGraficaTemporal.nombreExcel}`;
    this.cerrarModalGrafica();
    
    const dialogRef = this.dialog.open(DialogNombreGraficaComponent, {
      width: '400px',
      data: {
        nombreSugerido: nombreSugerido
      } as DialogNombreGraficaData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.subnivelActual && this.configGraficaTemporal) {
        if (!this.subnivelActual.graficas) {
          this.subnivelActual.graficas = [];
        }

        const grafica: any = {
          ...this.configGraficaTemporal,
          tituloPersonalizado: result,
          timestamp: Date.now()
        };
        this.subnivelActual.graficas.push(grafica);
        this.guardarCambios();
        this.configGraficaTemporal = null;
      } else {
        this.configGraficaTemporal = null;
      }
    });
  }

  eliminarGrafica(index: number) {
    if (this.subnivelActual) {
      this.subnivelActual.graficas.splice(index, 1);
      this.guardarCambios();
    }
  }

  // Crear collage desde imágenes existentes
  iniciarCreacionCollage() {
    if (!this.subnivelActual || this.subnivelActual.imagenes.length < 2) {
      return;
    }

    const dialogRef = this.dialog.open(DialogCollageComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        imagenes: this.subnivelActual.imagenes,
        nombreSugerido: 'Collage de imágenes'
      } as DialogCollageData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.subnivelActual && result.indices && result.indices.length >= 2) {
        // Obtener imágenes seleccionadas en orden
        const imagenesCollage = result.indices
          .map((index: number) => this.subnivelActual!.imagenes[index]);

        // Crear collage
        const collage: any = {
          tipo: 'collage',
          titulo: result.nombre,
          imagenes: imagenesCollage.map((img: any) => ({
            nombre: img.nombre,
            datos: img.datos
          })),
          timestamp: Date.now()
        };

        if (!(this.subnivelActual as any).collages) {
          (this.subnivelActual as any).collages = [];
        }
        (this.subnivelActual as any).collages.push(collage);

        // Remover imágenes seleccionadas del array de imágenes individuales
        // Remover en orden inverso para no afectar los índices
        result.indices
          .sort((a: number, b: number) => b - a)
          .forEach((index: number) => {
            this.subnivelActual!.imagenes.splice(index, 1);
          });

        this.guardarCambios();
      }
    });
  }

  eliminarCollage(index: number) {
    if (this.subnivelActual && (this.subnivelActual as any).collages && Array.isArray((this.subnivelActual as any).collages)) {
      (this.subnivelActual as any).collages.splice(index, 1);
      this.guardarCambios();
    }
  }

  // Obtener todos los elementos del contenido ordenados por timestamp de inserción
  obtenerContenidoOrdenado(): Array<{ tipo: 'excel' | 'imagen' | 'grafica' | 'collage'; item: any; index: number }> {
    if (!this.subnivelActual) return [];

    const items: Array<{ tipo: 'excel' | 'imagen' | 'grafica' | 'collage'; item: any; index: number }> = [];

    // Agregar archivos Excel con su índice original
    this.subnivelActual.archivosExcel.forEach((excel, index) => {
      items.push({
        tipo: 'excel',
        item: excel,
        index: index
      });
    });

    // Agregar imágenes con su índice original
    this.subnivelActual.imagenes.forEach((imagen, index) => {
      items.push({
        tipo: 'imagen',
        item: imagen,
        index: index
      });
    });

    // Agregar collages
    if ((this.subnivelActual as any).collages) {
      (this.subnivelActual as any).collages.forEach((collage: any, index: number) => {
        items.push({
          tipo: 'collage',
          item: collage,
          index: index
        });
      });
    }

    // Agregar gráficas con su índice original
    if (this.subnivelActual.graficas) {
      this.subnivelActual.graficas.forEach((grafica, index) => {
        items.push({
          tipo: 'grafica',
          item: grafica,
          index: index
        });
      });
    }

    // Ordenar por timestamp (si no existe timestamp, usar 0 para que aparezcan al inicio)
    items.sort((a, b) => {
      const timestampA = (a.item as any).timestamp || 0;
      const timestampB = (b.item as any).timestamp || 0;
      return timestampA - timestampB;
    });

    return items;
  }
}