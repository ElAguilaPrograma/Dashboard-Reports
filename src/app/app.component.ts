import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ReportStateService } from './services/report-state.service';
import { ExcelService } from './services/excel.service';
import { SidebarService } from './services/sidebar.service';
import { Planta, SubNivel } from './models/informe.model';
import { DialogNombreExcelComponent, DialogNombreExcelData } from './components/dialog-nombre-excel/dialog-nombre-excel.component';
import { DialogNombreImagenComponent, DialogNombreImagenData } from './components/dialog-nombre-imagen/dialog-nombre-imagen.component';
import { DialogNombreGraficaComponent, DialogNombreGraficaData } from './components/dialog-nombre-grafica/dialog-nombre-grafica.component';
import { DialogCollageComponent, DialogCollageData } from './components/dialog-collage/dialog-collage.component';
import { DialogEditarTituloComponent, DialogEditarTituloData } from './components/dialog-editar-titulo/dialog-editar-titulo.component';
import { DialogAgregarContenidoComponent, DialogAgregarContenidoData } from './components/dialog-agregar-contenido/dialog-agregar-contenido.component';

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
  
  sidebarVisible$: Observable<boolean>;
  imagenExpandida: any = null;

  // Arreglo cacheado para CDK y para mantener orden persistente
  contenidoOrdenado: Array<{ tipo: 'excel' | 'imagen' | 'grafica' | 'collage' | 'texto'; item: any; index: number }> = [];

  // Datos temporales para modales
  archivoExcelTemporal: any = null;
  archivosImagenesTemporales: any[] = [];
  configGraficaTemporal: any = null;

  constructor(
    private reportService: ReportStateService,
    private excelService: ExcelService,
    private sidebarService: SidebarService,
    private dialog: MatDialog
  ) {
    this.sidebarVisible$ = this.sidebarService.sidebarVisible$;
  }

  ngOnInit() {
    this.reportService.plantas$.subscribe(plantas => {
      this.plantas = plantas;
      this.actualizarSubnivelActual();
    });
  }

  onPlantaActivaChange(plantaIndex: number) {
    this.plantaActiva = plantaIndex;
    // Reset subnivel selection when changing plant
    this.subnivelSeleccionado = null;
    this.actualizarSubnivelActual();
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
      this.refreshContenidoOrdenado();
    }
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

  // Nuevo método para eliminar tabla individual de un archivo multi-tabla
  eliminarTablaIndividual(excelIndex: number, tablaIndex: number) {
    if (!this.subnivelActual) return;
    
    const archivoExcel = this.subnivelActual.archivosExcel[excelIndex];
    if (!archivoExcel || !archivoExcel.esMultiTabla || !archivoExcel.tablas) return;
    
    // Eliminar la tabla específica
    archivoExcel.tablas.splice(tablaIndex, 1);
    
    // Si solo queda una tabla, convertir a formato simple
    if (archivoExcel.tablas.length === 1) {
      archivoExcel.datos = archivoExcel.tablas[0].datos;
      archivoExcel.esMultiTabla = false;
      archivoExcel.tablas = [];
    }
    
    // Si no quedan tablas, eliminar el archivo completo
    if (archivoExcel.tablas.length === 0) {
      this.subnivelActual.archivosExcel.splice(excelIndex, 1);
    }
    
    this.guardarCambios();
  }

  guardarCambios() {
    if (this.subnivelSeleccionado && this.subnivelActual) {
      this.reportService.actualizarSubnivel(
        this.plantaActiva,
        this.subnivelSeleccionado.nivelIndex,
        this.subnivelSeleccionado.subnivelIndex,
        this.subnivelActual
      );
      // Recalcular cache para que el template y CDK trabajen sobre la referencia correcta
      this.refreshContenidoOrdenado();
    }
  }

  abrirModalGrafica(excelIndex: number) {
    if (!this.subnivelActual) return;
    
    const archivoExcel = this.subnivelActual.archivosExcel[excelIndex];
    this.archivoExcelTemporal = archivoExcel;
    this.configGraficaTemporal = null; // Limpiar configuración de tabla individual
    this.excelIndexSeleccionado = excelIndex;
    this.mostrarModalGrafica = true;
  }

  cerrarModalGrafica() {
    this.mostrarModalGrafica = false;
    this.configGraficaTemporal = null; // Limpiar configuración temporal
    this.archivoExcelTemporal = null; // Limpiar archivo temporal
  }

  crearGrafica(config: { excelIndex: number; tipo: 'bar' | 'line' | 'pie' | 'radar'; columnas: number[] }) {
    console.log('Crear gráfica recibida:', config);
    console.log('ArchivoExcelTemporal:', this.archivoExcelTemporal);
    console.log('ConfigGraficaTemporal:', this.configGraficaTemporal);
    
    if (!this.subnivelActual) {
      console.error('No hay subnivel actual');
      return;
    }

    let datos: any[][];
    let nombreGrafica: string;
    let nombreExcel: string;
    
    // Usar archivoExcelTemporal que contiene los datos correctos
    if (this.archivoExcelTemporal && this.archivoExcelTemporal.datos) {
      datos = this.archivoExcelTemporal.datos;
      nombreGrafica = this.archivoExcelTemporal.tituloPersonalizado || this.archivoExcelTemporal.nombre;
      nombreExcel = this.archivoExcelTemporal.nombre;
      console.log('Usando archivoExcelTemporal:', nombreExcel);
    } else {
      console.error('Error: No hay datos válidos en archivoExcelTemporal');
      alert('Error: No se pueden obtener los datos para crear la gráfica');
      return;
    }

    const headers = datos[0];
    const filas = datos.slice(1).filter(fila => fila && fila.length > 0); // Filtrar filas vacías

    console.log('Headers:', headers);
    console.log('Filas filtradas:', filas);
    console.log('Columnas seleccionadas:', config.columnas);

    if (filas.length === 0) {
      alert('Error: No hay datos válidos en la tabla seleccionada');
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

    console.log('Datos procesados para gráfica:', datosGrafica);
    console.log('Datos válidos para gráfica:', datosValidos);

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
      nombreExcel: nombreExcel
    };
    const nombreSugerido = `Gráfica de ${this.configGraficaTemporal.nombreExcel}`;
    console.log('Configuración guardada temporalmente:', this.configGraficaTemporal);
    console.log('Cerrando modal gráfica y abriendo diálogo nombre...');
    
    // Solo cerrar el modal visual, NO limpiar las configuraciones aún
    this.mostrarModalGrafica = false;
    
    const dialogRef = this.dialog.open(DialogNombreGraficaComponent, {
      width: '400px',
      data: {
        nombreSugerido: nombreSugerido
      } as DialogNombreGraficaData
    });

    console.log('Diálogo abierto, esperando respuesta...');
    dialogRef.afterClosed().subscribe({
      next: (result) => {
        console.log('Diálogo cerrado con resultado:', result);
        console.log('Validación - result:', !!result, 'subnivelActual:', !!this.subnivelActual, 'configGraficaTemporal:', !!this.configGraficaTemporal);
        console.log('configGraficaTemporal contenido:', this.configGraficaTemporal);
        if (result && this.subnivelActual && this.configGraficaTemporal) {
          console.log('Creando gráfica con nombre:', result);
          if (!this.subnivelActual.graficas) {
            this.subnivelActual.graficas = [];
          }

          const grafica: any = {
            ...this.configGraficaTemporal,
            tituloPersonalizado: result,
            timestamp: Date.now()
          };
          
          console.log('Gráfica creada:', grafica);
          this.subnivelActual.graficas.push(grafica);
          this.guardarCambios();
          console.log('Gráfica añadida al subnivel, guardando cambios...');
        } else {
          console.log('Diálogo cancelado o sin datos válidos');
        }
        
        // Limpiar configuraciones temporales siempre al final
        this.configGraficaTemporal = null;
        this.archivoExcelTemporal = null;
      },
      error: (error) => {
        console.error('Error en el diálogo:', error);
        this.configGraficaTemporal = null;
        this.archivoExcelTemporal = null;
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
  obtenerContenidoOrdenado(): Array<{ tipo: 'excel' | 'imagen' | 'grafica' | 'collage' | 'texto'; item: any; index: number }> {
    if (!this.subnivelActual) return [];

    const items: Array<{ tipo: 'excel' | 'imagen' | 'grafica' | 'collage' | 'texto'; item: any; index: number }> = [];

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

    // Agregar tarjetas de texto
    if (this.subnivelActual.tarjetasTexto) {
      this.subnivelActual.tarjetasTexto.forEach((tarjeta, index) => {
        items.push({
          tipo: 'texto',
          item: tarjeta,
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

  // Métodos para el layout dashboard
  esGraficaGrande(grafica: any): boolean {
    // Las gráficas de pastel siempre son pequeñas
    if (grafica.tipo === 'pie') {
      return false;
    }
    // Las gráficas de radar siempre son grandes
    if (grafica.tipo === 'radar') {
      return true;
    }
    // Las gráficas con más de 10 puntos de datos se consideran grandes (2 columnas)
    // Las demás ocupan 1 columna
    return grafica.datos && grafica.datos.length > 10;
  }

  // Determinar si una tabla Excel es "grande" según su tamaño
  esTablaGrande(excel: any): boolean {
    if (!excel || !excel.datos || excel.datos.length === 0) {
      return false;
    }
    
    // Obtener cantidad de filas y columnas
    const numFilas = excel.datos.length - 1; // Excluir header
    const numColumnas = excel.datos[0]?.length || 0;
    
    // Considerar tabla grande si:
    // - Tiene más de 5 columnas O
    // - Tiene más de 15 filas (muchos datos)
    return numColumnas > 5 || numFilas > 15;
  }

  expandirImagen(imagen: any): void {
    this.imagenExpandida = imagen;
  }

  abrirDialogoEditarInfo(): void {
    if (!this.subnivelActual) {
      alert('Por favor selecciona un nivel primero');
      return;
    }

    const dialogRef = this.dialog.open(DialogEditarTituloComponent, {
      width: '500px',
      data: {
        titulo: this.subnivelActual.titulo || '',
        descripcion: this.subnivelActual.descripcion || ''
      } as DialogEditarTituloData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.subnivelActual) {
        this.subnivelActual.titulo = result.titulo;
        this.subnivelActual.descripcion = result.descripcion;
        this.guardarCambios();
      }
    });
  }

  abrirDialogoAgregarContenido(): void {
    if (!this.subnivelActual) {
      alert('Por favor selecciona un nivel primero');
      return;
    }

    const dialogRef = this.dialog.open(DialogAgregarContenidoComponent, {
      width: '500px',
      data: {} as DialogAgregarContenidoData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result || !this.subnivelActual) return;

      switch (result.tipo) {
        case 'excel':
          this.procesarExcelDelDialog(result.archivo);
          break;
        case 'imagenes':
          this.procesarImagenesDelDialog(result.archivos);
          break;
        case 'collage':
          this.iniciarCreacionCollage();
          break;
        case 'texto':
          this.agregarTarjetaTexto(result.titulo, result.contenido);
          break;
      }
    });
  }

  private procesarExcelDelDialog(file: File): void {
    if (!this.subnivelActual) return;

    this.excelService.leerExcel(file).then(excel => {
      this.archivoExcelTemporal = excel;

      const dialogRef = this.dialog.open(DialogNombreExcelComponent, {
        width: '400px',
        data: {
          nombreSugerido: file.name.replace(/\.[^/.]+$/, '')
        } as DialogNombreExcelData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && this.archivoExcelTemporal && this.subnivelActual) {
          (this.archivoExcelTemporal as any).timestamp = Date.now();
          (this.archivoExcelTemporal as any).tituloPersonalizado = result;
          this.subnivelActual.archivosExcel.push(this.archivoExcelTemporal);
          this.guardarCambios();
          this.archivoExcelTemporal = null;
        }
      });
    }).catch(error => {
      alert('Error al cargar Excel: ' + error);
    });
  }

  private procesarImagenesDelDialog(files: File[]): void {
    if (!this.subnivelActual) return;

    const lectores = Array.from(files).map(file => {
      return new Promise<{ nombre: string; datos: string }>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = (e) => {
          resolve({
            nombre: file.name,
            datos: e.target?.result as string
          });
        };
        lector.onerror = reject;
        lector.readAsDataURL(file);
      });
    });

    Promise.all(lectores).then(imagenes => {
      if (!this.subnivelActual) return;

      // Si hay múltiples imágenes, preguntar por el nombre personalizado
      if (imagenes.length === 1) {
        const dialogRef = this.dialog.open(DialogNombreImagenComponent, {
          width: '400px',
          data: {
            nombreSugerido: imagenes[0].nombre.replace(/\.[^/.]+$/, '')
          } as DialogNombreImagenData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result && this.subnivelActual) {
            imagenes[0].nombre = result;
            (imagenes[0] as any).timestamp = Date.now();
            (imagenes[0] as any).tituloPersonalizado = result;
            this.subnivelActual.imagenes.push(imagenes[0]);
            this.guardarCambios();
          }
        });
      } else {
        // Para múltiples imágenes, agregarlas sin pedir nombre
        imagenes.forEach(img => {
          (img as any).timestamp = Date.now();
          (img as any).tituloPersonalizado = img.nombre.replace(/\.[^/.]+$/, '');
          this.subnivelActual!.imagenes.push(img);
        });
        this.guardarCambios();
      }
    });
  }

  private agregarTarjetaTexto(titulo: string, contenido: string): void {
    if (!this.subnivelActual) return;

    if (!this.subnivelActual.tarjetasTexto) {
      this.subnivelActual.tarjetasTexto = [];
    }

    const tarjeta = {
      id: `texto_${Date.now()}`,
      titulo,
      contenido,
      timestamp: Date.now()
    };

    this.subnivelActual.tarjetasTexto.push(tarjeta);
    this.guardarCambios();
  }

  eliminarTarjetaTexto(index: number): void {
    if (this.subnivelActual && this.subnivelActual.tarjetasTexto) {
      this.subnivelActual.tarjetasTexto.splice(index, 1);
      this.guardarCambios();
    }
  }



  // Refrescar el arreglo cacheado usado por el template y CDK
  private refreshContenidoOrdenado(): void {
    this.contenidoOrdenado = this.obtenerContenidoOrdenado();
  }

  // Actualizar archivo Excel existente
  actualizarArchivoExcel(excelIndex: number): void {
    if (!this.subnivelActual) return;

    // Crear input de archivo oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      this.excelService.leerExcel(file).then(nuevoExcel => {
        // Validar que tenga datos
        if (!nuevoExcel.datos || nuevoExcel.datos.length === 0) {
          alert('Error: El archivo Excel no contiene datos válidos');
          return;
        }

        const excelAnterior = this.subnivelActual!.archivosExcel[excelIndex];
        const columnasAnteriores = excelAnterior.datos[0] || [];
        const columnasNuevas = nuevoExcel.datos[0] || [];

        // Validar que el nuevo Excel tenga columnas
        if (columnasNuevas.length === 0) {
          alert('Error: El archivo Excel no tiene columnas válidas');
          return;
        }

        // Verificar gráficas dependientes
        const graficasDependientes = this.subnivelActual!.graficas.filter(
          g => g.excelIndex === excelIndex
        );

        if (graficasDependientes.length > 0) {
          // Validar que todas las columnas usadas en gráficas existan en el nuevo archivo
          const columnasUsadas = new Set<string>();
          graficasDependientes.forEach(grafica => {
            grafica.columnas.forEach(col => columnasUsadas.add(col));
          });

          const columnasNoEncontradas = Array.from(columnasUsadas).filter(
            col => !columnasNuevas.includes(col)
          );

          if (columnasNoEncontradas.length > 0) {
            const mensaje = `Advertencia: Las siguientes columnas usadas en gráficas no existen en el nuevo archivo:\n${columnasNoEncontradas.join(', ')}\n\n¿Deseas continuar? Las gráficas se recalcularán pero podrían mostrar datos incorrectos.`;
            if (!confirm(mensaje)) {
              return;
            }
          }
        }

        // Actualizar los datos del Excel
        this.subnivelActual!.archivosExcel[excelIndex] = {
          nombre: nuevoExcel.nombre,
          datos: nuevoExcel.datos,
          tituloPersonalizado: excelAnterior.tituloPersonalizado || excelAnterior.nombre,
          timestamp: Date.now()
        };

        // Recalcular gráficas dependientes
        if (graficasDependientes.length > 0) {
          this.recalcularGraficasDelExcel(excelIndex);
        }

        this.guardarCambios();
        alert('Archivo Excel actualizado correctamente. Las gráficas se han actualizado automáticamente.');
      }).catch(error => {
        alert('Error al cargar el archivo Excel: ' + error);
      });
    };

    input.click();
  }

  // Recalcular las gráficas que dependen de un archivo Excel específico
  private recalcularGraficasDelExcel(excelIndex: number): void {
    if (!this.subnivelActual) return;

    const excel = this.subnivelActual.archivosExcel[excelIndex];
    if (!excel || !excel.datos || excel.datos.length === 0) return;

    const headers = excel.datos[0];
    const filas = excel.datos.slice(1).filter(fila => fila && fila.length > 0);

    // Procesar cada gráfica dependiente
    this.subnivelActual.graficas.forEach(grafica => {
      if (grafica.excelIndex === excelIndex) {
        // Obtener índices de columnas por nombre
        const columnasIndices = grafica.columnas
          .map(nombreCol => headers.indexOf(nombreCol))
          .filter(idx => idx !== -1);

        if (columnasIndices.length === 0) {
          console.warn(`No se encontraron columnas para la gráfica: ${grafica.tituloPersonalizado}`);
          return;
        }

        // Función auxiliar para convertir valores a números cuando sea posible
        const convertirValor = (valor: any): any => {
          if (valor === null || valor === undefined || valor === '') {
            return null;
          }
          const num = Number(valor);
          if (!isNaN(num) && isFinite(num)) {
            return num;
          }
          return valor;
        };

        // Recalcular datos de la gráfica
        const datosGrafica = filas.map(fila => {
          const obj: any = {};
          columnasIndices.forEach((colIndex, posicion) => {
            const header = headers[colIndex];
            const valor = fila[colIndex];
            // La primera columna se mantiene como string (label)
            if (posicion === 0) {
              obj[header] = valor !== null && valor !== undefined ? String(valor) : '';
            } else {
              obj[header] = convertirValor(valor);
            }
          });
          return obj;
        });

        // Filtrar datos válidos (al menos una columna numérica)
        const datosValidos = datosGrafica.filter(row => {
          return columnasIndices.slice(1).some(colIndex => {
            const header = headers[colIndex];
            return row[header] !== null && row[header] !== undefined && typeof row[header] === 'number';
          });
        });

        // Actualizar los datos de la gráfica
        if (datosValidos.length > 0) {
          grafica.datos = datosValidos;
        } else {
          console.warn(`No hay datos válidos para la gráfica: ${grafica.tituloPersonalizado}`);
        }
      }
    });
  }

  // Métodos para mejorar la presentación de las tablas
  isNumeric(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    
    // Convertir a string y limpiar
    const stringValue = String(value).trim();
    
    // Verificar si es un número válido
    const numericValue = parseFloat(stringValue.replace(/,/g, ''));
    return !isNaN(numericValue) && isFinite(numericValue);
  }

  formatCellData(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Si es numérico, formatear con separadores de miles
    if (this.isNumeric(value)) {
      const numericValue = parseFloat(String(value).replace(/,/g, ''));
      
      // Formatear números enteros sin decimales
      if (Number.isInteger(numericValue)) {
        return numericValue.toLocaleString('es-ES');
      } else {
        // Formatear números decimales con máximo 2 decimales
        return numericValue.toLocaleString('es-ES', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });
      }
    }

    // Para texto, retornar tal como está
    return String(value);
  }

  // Métodos para mejorar la presentación de imágenes y collages
  getImageSize(imagen: any): string {
    // Por ahora retornamos una cadena vacía, se puede implementar la lógica real
    return '';
  }

  onImageLoad(event: Event, imagen: any): void {
    const img = event.target as HTMLImageElement;
    if (img && imagen) {
      // Guardar dimensiones de la imagen para mostrar en metadatos
      imagen.width = img.naturalWidth;
      imagen.height = img.naturalHeight;
    }
  }

  downloadImage(imagen: any): void {
    if (imagen && imagen.datos) {
      const link = document.createElement('a');
      link.href = imagen.datos;
      link.download = imagen.tituloPersonalizado || imagen.nombre || 'imagen';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  downloadAllImages(collage: any): void {
    if (collage && collage.imagenes) {
      collage.imagenes.forEach((imagen: any, index: number) => {
        setTimeout(() => {
          this.downloadImage(imagen);
        }, index * 500); // Descargar con un pequeño delay entre cada una
      });
    }
  }

  startSlideshow(collage: any): void {
    // Implementar funcionalidad de presentación
    if (collage && collage.imagenes && collage.imagenes.length > 0) {
      // Por ahora expandir la primera imagen
      this.expandirImagen(collage.imagenes[0]);
    }
    console.log('Iniciando presentación:', collage);
  }

  // Modal de tabla expandida
  mostrarModalTabla = false;
  tablaExpandida: any = null;
  tablaExpandidaIndex = 0;
  columnaOrdenada = -1;
  ordenAscendente = true;
  datosOrdenados: any[] = [];

  // Modal de gráfica expandida
  mostrarModalGraficaExpandida = false;
  graficaExpandida: any = null;
  graficaExpandidaIndex = 0;

  expandirTabla(excelIndex: number) {
    if (!this.subnivelActual) return;
    this.tablaExpandida = this.subnivelActual.archivosExcel[excelIndex];
    this.tablaExpandidaIndex = excelIndex;
    this.datosOrdenados = [...this.tablaExpandida.datos.slice(1)];
    this.columnaOrdenada = -1;
    this.mostrarModalTabla = true;
  }

  expandirTablaIndividual(excelIndex: number, tablaIndex: number) {
    if (!this.subnivelActual) return;
    const archivoExcel = this.subnivelActual.archivosExcel[excelIndex];
    if (!archivoExcel.tablas || !archivoExcel.tablas[tablaIndex]) return;
    
    const tabla = archivoExcel.tablas[tablaIndex];
    // Crear un objeto temporal que simule un ArchivoExcel para la modal existente
    this.tablaExpandida = {
      nombre: `${archivoExcel.nombre} - ${tabla.titulo}`,
      datos: tabla.datos,
      tituloPersonalizado: tabla.titulo
    };
    this.tablaExpandidaIndex = excelIndex;
    this.datosOrdenados = [...tabla.datos.slice(1)];
    this.columnaOrdenada = -1;
    this.mostrarModalTabla = true;
  }

  abrirModalGraficaTabla(excelIndex: number, tablaIndex: number) {
    if (!this.subnivelActual) return;
    const archivoExcel = this.subnivelActual.archivosExcel[excelIndex];
    if (!archivoExcel.tablas || !archivoExcel.tablas[tablaIndex]) return;
    
    const tabla = archivoExcel.tablas[tablaIndex];
    
    // Crear un objeto temporal que simule un ArchivoExcel para el modal de gráfica
    this.archivoExcelTemporal = {
      nombre: `${archivoExcel.nombre} - ${tabla.titulo}`,
      datos: tabla.datos,
      tituloPersonalizado: tabla.titulo
    };
    
    // Guardar información de la tabla específica para el modal de gráfica
    this.configGraficaTemporal = {
      excelIndex: excelIndex,
      tablaIndex: tablaIndex,
      tabla: tabla
    };
    
    this.excelIndexSeleccionado = excelIndex;
    this.mostrarModalGrafica = true;
  }

  cerrarModalTabla() {
    this.mostrarModalTabla = false;
    this.tablaExpandida = null;
    this.datosOrdenados = [];
  }

  // Métodos para gráfica expandida
  expandirGrafica(event: {grafica: any, index: number}) {
    if (!this.subnivelActual) return;
    this.graficaExpandida = event.grafica;
    this.graficaExpandidaIndex = event.index;
    this.mostrarModalGraficaExpandida = true;
  }

  cerrarModalGraficaExpandida() {
    this.mostrarModalGraficaExpandida = false;
    this.graficaExpandida = null;
  }

  getChartTypeName(tipo: string): string {
    switch (tipo) {
      case 'bar': return 'Gráfica de Barras';
      case 'line': return 'Gráfica de Líneas';
      case 'pie': return 'Gráfica Circular';
      case 'radar': return 'Gráfica de Radar';
      default: return 'Gráfica';
    }
  }

  ordenarColumna(columnIndex: number) {
    if (this.columnaOrdenada === columnIndex) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrdenada = columnIndex;
      this.ordenAscendente = true;
    }

    this.datosOrdenados.sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];
      
      // Verificar si son números
      const aNum = this.esNumerico(aVal) ? parseFloat(aVal) : aVal;
      const bNum = this.esNumerico(bVal) ? parseFloat(bVal) : bVal;
      
      let comparison = 0;
      if (aNum < bNum) comparison = -1;
      if (aNum > bNum) comparison = 1;
      
      return this.ordenAscendente ? comparison : -comparison;
    });
  }

  esNumerico(valor: any): boolean {
    return !isNaN(parseFloat(valor)) && isFinite(valor);
  }

  formatearCelda(valor: any): string {
    if (valor === null || valor === undefined) return '';
    if (this.esNumerico(valor)) {
      const num = parseFloat(valor);
      return num.toLocaleString('es-ES', { maximumFractionDigits: 2 });
    }
    return valor.toString();
  }

  descargarCSV() {
    if (!this.tablaExpandida) return;
    
    const csvContent = this.tablaExpandida.datos.map((fila: any[]) => 
      fila.map((celda: any) => `"${celda}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.tablaExpandida.nombre}.csv`;
    link.click();
  }

  imprimirTabla() {
    window.print();
  }

  // Métodos para exportación/importación de configuración
  async exportarConfiguracion() {
    try {
      const nombreArchivo = `configuracion-radar-${new Date().toISOString().split('T')[0]}.json`;
      const success = await this.reportService.exportarConfiguracion(nombreArchivo);
      
      if (success) {
        this.mostrarMensajeExito('Configuración exportada exitosamente');
      } else {
        alert('Error al exportar la configuración');
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      alert('Error al exportar la configuración');
    }
  }

  importarConfiguracion() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;

    input.onchange = async (event: any) => {
      const archivo = event.target.files[0];
      if (!archivo) return;

      try {
        const result = await this.reportService.importarConfiguracion(archivo);
        
        if (result.success) {
          this.mostrarMensajeExito('Configuración importada exitosamente. Todos los datos han sido reemplazados.');
          // Refrescar la vista
          this.refreshContenidoOrdenado();
        } else {
          alert('Error al importar: ' + (result.error || 'Archivo inválido'));
        }
      } catch (error) {
        console.error('Error en importación:', error);
        alert('Error al procesar el archivo de configuración');
      }
    };

    input.click();
  }

  importarYMezclarConfiguracion() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;

    input.onchange = async (event: any) => {
      const archivo = event.target.files[0];
      if (!archivo) return;

      try {
        const result = await this.reportService.importarYMezclarConfiguracion(archivo);
        
        if (result.success) {
          this.mostrarMensajeExito('Configuración mezclada exitosamente. El contenido se ha añadido a los datos existentes.');
          // Refrescar la vista
          this.refreshContenidoOrdenado();
        } else {
          alert('Error al importar: ' + (result.error || 'Archivo inválido'));
        }
      } catch (error) {
        console.error('Error en importación:', error);
        alert('Error al procesar el archivo de configuración');
      }
    };

    input.click();
  }

  private mostrarMensajeExito(mensaje: string) {
    // Toast de éxito temporal
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
      max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
}