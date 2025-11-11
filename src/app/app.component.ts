import { Component, OnInit } from '@angular/core';
import { ReportStateService } from './services/report-state.service';
import { ExcelService } from './services/excel.service';
import { Planta, SubNivel } from './models/informe.model';

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

  constructor(
    private reportService: ReportStateService,
    private excelService: ExcelService
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
        this.subnivelActual.archivosExcel.push(excel);
        this.guardarCambios();
      } catch (error) {
        alert('Error al cargar Excel: ' + error);
      }
    }
    event.target.value = '';
  }

  async onImagenesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (this.subnivelActual) {
      for (const file of files) {
        try {
          const datos = await this.excelService.leerImagen(file);
          this.subnivelActual.imagenes.push({ nombre: file.name, datos });
        } catch (error) {
          console.error('Error al cargar imagen:', error);
        }
      }
      this.guardarCambios();
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
    const headers = excel.datos[0];
    const filas = excel.datos.slice(1);

    const datosGrafica = filas.map(fila => {
      const obj: any = {};
      config.columnas.forEach(colIndex => {
        obj[headers[colIndex]] = fila[colIndex];
      });
      return obj;
    });

    if (!this.subnivelActual.graficas) {
      this.subnivelActual.graficas = [];
    }

    this.subnivelActual.graficas.push({
      tipo: config.tipo,
      datos: datosGrafica,
      columnas: config.columnas.map(i => headers[i]),
      excelIndex: config.excelIndex,
      nombreExcel: excel.nombre
    });

    this.guardarCambios();
    this.cerrarModalGrafica();
  }

  eliminarGrafica(index: number) {
    if (this.subnivelActual) {
      this.subnivelActual.graficas.splice(index, 1);
      this.guardarCambios();
    }
  }
}