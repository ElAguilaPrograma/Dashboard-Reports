import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ArchivoExcel, TablaExcel } from '../models/informe.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  
  leerExcel(file: File): Promise<ArchivoExcel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            defval: '' 
          });
          
          // Detectar múltiples tablas
          console.log(`Procesando archivo Excel: ${file.name} con ${jsonData.length} filas`);
          const tablasDetectadas = this.detectarTablas(jsonData);
          const esMultiTabla = tablasDetectadas.length > 1;
          
          console.log(`Resultado: ${tablasDetectadas.length} tablas detectadas, esMultiTabla: ${esMultiTabla}`);
          
          resolve({
            nombre: file.name,
            datos: jsonData, // Mantener para compatibilidad
            tablas: tablasDetectadas,
            esMultiTabla: esMultiTabla
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  leerImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Detecta múltiples tablas en un array de datos Excel
   * Usa algoritmo avanzado de detección de regiones
   */
  private detectarTablas(datos: any[][]): TablaExcel[] {
    if (!datos || datos.length === 0) {
      return [];
    }

    console.log('Detectando tablas en', datos.length, 'filas');
    
    // Intentar detección por regiones (maneja distribuciones complejas)
    const tablasRegiones = this.detectarTablasHorizontales(datos);
    if (tablasRegiones.length > 1) {
      console.log(`Detectadas ${tablasRegiones.length} tablas por regiones`);
      return tablasRegiones;
    }
    
    // Si no hay múltiples regiones, intentar detección vertical tradicional
    const tablasVerticales = this.detectarTablasVerticales(datos);
    if (tablasVerticales.length > 1) {
      console.log(`Detectadas ${tablasVerticales.length} tablas verticales`);
      return tablasVerticales;
    }
    
    // Si no se detectaron tablas múltiples, devolver toda la data como una tabla
    const datosLimpios = this.limpiarDatosTabla(datos);
    if (datosLimpios.length > 0) {
      return [{
        titulo: 'Tabla Principal',
        datos: datosLimpios,
        inicioFila: 0,
        finFila: datos.length - 1,
        id: 'tabla_1'
      }];
    }
    
    return [];
  }
  
  /**
   * Detecta tablas usando algoritmo de detección de regiones avanzado
   */
  private detectarTablasHorizontales(datos: any[][]): TablaExcel[] {
    if (!datos || datos.length === 0) return [];
    
    console.log('Buscando regiones de tablas...');
    
    // Crear mapa de celdas con contenido
    const mapaCeldas = this.crearMapaCeldas(datos);
    const regiones = this.encontrarRegiones(mapaCeldas, datos.length, Math.max(...datos.map(f => f.length)));
    
    console.log(`Encontradas ${regiones.length} regiones de datos`);
    
    const tablas: TablaExcel[] = [];
    
    for (const region of regiones) {
      const datosTabla = this.extraerDatosRegion(datos, region);
      const tablaLimpia = this.limpiarDatosTabla(datosTabla);
      
      if (this.esTablaValida(tablaLimpia)) {
        console.log(`Tabla detectada en región: filas ${region.filaMin}-${region.filaMax}, columnas ${region.colMin}-${region.colMax}`);
        tablas.push({
          titulo: this.generarTituloTabla(tablaLimpia[0], tablas.length + 1),
          datos: tablaLimpia,
          inicioFila: region.filaMin,
          finFila: region.filaMax,
          id: `tabla_${tablas.length + 1}`
        });
      }
    }
    
    return tablas;
  }
  
  /**
   * Crea un mapa de celdas que tienen contenido
   */
  private crearMapaCeldas(datos: any[][]): boolean[][] {
    const mapa: boolean[][] = [];
    
    for (let fila = 0; fila < datos.length; fila++) {
      mapa[fila] = [];
      const filaActual = datos[fila] || [];
      
      for (let col = 0; col < Math.max(...datos.map(f => f.length)); col++) {
        const celda = filaActual[col];
        mapa[fila][col] = celda !== null && 
                         celda !== undefined && 
                         celda.toString().trim() !== '';
      }
    }
    
    return mapa;
  }
  
  /**
   * Encuentra regiones conectadas de celdas con datos
   */
  private encontrarRegiones(mapa: boolean[][], maxFilas: number, maxCols: number): any[] {
    const visitado: boolean[][] = Array(maxFilas).fill(null).map(() => Array(maxCols).fill(false));
    const regiones: any[] = [];
    
    for (let fila = 0; fila < maxFilas; fila++) {
      for (let col = 0; col < maxCols; col++) {
        if (mapa[fila] && mapa[fila][col] && !visitado[fila][col]) {
          const region = this.explorarRegion(mapa, visitado, fila, col, maxFilas, maxCols);
          
          // Solo considerar regiones que parezcan tablas (al menos 4 celdas y forma rectangular)
          if (this.esRegionTabular(region)) {
            regiones.push(region);
          }
        }
      }
    }
    
    return regiones;
  }
  
  /**
   * Explora una región conectada usando algoritmo de flood-fill
   */
  private explorarRegion(mapa: boolean[][], visitado: boolean[][], filaInicio: number, colInicio: number, maxFilas: number, maxCols: number): any {
    const region = {
      filaMin: filaInicio,
      filaMax: filaInicio,
      colMin: colInicio,
      colMax: colInicio,
      celdas: 0
    };
    
    const cola: [number, number][] = [[filaInicio, colInicio]];
    visitado[filaInicio][colInicio] = true;
    
    while (cola.length > 0) {
      const [fila, col] = cola.shift()!;
      region.celdas++;
      
      // Actualizar límites de la región
      region.filaMin = Math.min(region.filaMin, fila);
      region.filaMax = Math.max(region.filaMax, fila);
      region.colMin = Math.min(region.colMin, col);
      region.colMax = Math.max(region.colMax, col);
      
      // Explorar celdas adyacentes (incluyendo diagonales para capturar tablas dispersas)
      const direcciones = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      
      for (const [df, dc] of direcciones) {
        const nuevaFila = fila + df;
        const nuevaCol = col + dc;
        
        if (nuevaFila >= 0 && nuevaFila < maxFilas &&
            nuevaCol >= 0 && nuevaCol < maxCols &&
            mapa[nuevaFila] && mapa[nuevaFila][nuevaCol] &&
            !visitado[nuevaFila][nuevaCol]) {
          
          visitado[nuevaFila][nuevaCol] = true;
          cola.push([nuevaFila, nuevaCol]);
        }
      }
    }
    
    return region;
  }
  
  /**
   * Verifica si una región tiene forma tabular
   */
  private esRegionTabular(region: any): boolean {
    const ancho = region.colMax - region.colMin + 1;
    const alto = region.filaMax - region.filaMin + 1;
    const areaTotal = ancho * alto;
    
    // Una tabla debe tener:
    // 1. Al menos 4 celdas
    // 2. Al menos 2x2 de dimensión
    // 3. Densidad razonable (al menos 30% de las celdas tienen datos)
    return region.celdas >= 4 &&
           ancho >= 2 && alto >= 2 &&
           (region.celdas / areaTotal) >= 0.3;
  }
  
  /**
   * Extrae datos de una región específica
   */
  private extraerDatosRegion(datos: any[][], region: any): any[][] {
    const datosRegion: any[][] = [];
    
    for (let fila = region.filaMin; fila <= region.filaMax; fila++) {
      const filaActual = datos[fila] || [];
      const filaNueva = [];
      
      for (let col = region.colMin; col <= region.colMax; col++) {
        filaNueva.push(filaActual[col] || '');
      }
      
      datosRegion.push(filaNueva);
    }
    
    return datosRegion;
  }
  
  /**
   * Verifica si los datos extraídos forman una tabla válida
   */
  private esTablaValida(datos: any[][]): boolean {
    if (!datos || datos.length < 2) return false;
    
    // Debe tener al menos una fila de encabezado y una de datos
    const tieneEncabezado = datos[0].some(celda => 
      celda && celda.toString().trim() !== '' && isNaN(Number(celda))
    );
    
    const tieneDatos = datos.slice(1).some(fila =>
      fila.some(celda => celda && celda.toString().trim() !== '')
    );
    
    return tieneEncabezado && tieneDatos;
  }
  
  /**
   * Detecta tablas dispuestas verticalmente (separadas por filas vacías)
   */
  private detectarTablasVerticales(datos: any[][]): TablaExcel[] {
    console.log('Buscando tablas verticales...');
    
    const tablas: TablaExcel[] = [];
    let inicioTabla = 0;
    let filaVaciaConsecutiva = 0;
    
    // Buscar primer fila no vacía para empezar
    while (inicioTabla < datos.length && this.esFilaVacia(datos[inicioTabla])) {
      inicioTabla++;
    }
    
    for (let i = inicioTabla; i <= datos.length; i++) {
      const esFilaVacia = i < datos.length ? this.esFilaVacia(datos[i]) : true;
      const esFinalArchivo = i === datos.length;
      
      if (esFilaVacia) {
        filaVaciaConsecutiva++;
      } else {
        filaVaciaConsecutiva = 0;
      }
      
      // Detectar separación: 2+ filas vacías consecutivas o final de archivo
      if ((filaVaciaConsecutiva >= 2) || esFinalArchivo) {
        const finTabla = esFinalArchivo ? i : (i - filaVaciaConsecutiva + 1);
        
        if (finTabla > inicioTabla) {
          const datosTabla = datos.slice(inicioTabla, finTabla);
          const tablaLimpia = this.limpiarDatosTabla(datosTabla);
          
          if (tablaLimpia.length > 0 && this.tieneContenidoValido(tablaLimpia)) {
            console.log(`Tabla vertical encontrada: filas ${inicioTabla}-${finTabla-1}`);
            tablas.push({
              titulo: this.generarTituloTabla(tablaLimpia[0], tablas.length + 1),
              datos: tablaLimpia,
              inicioFila: inicioTabla,
              finFila: finTabla - 1,
              id: `tabla_${tablas.length + 1}`
            });
          }
        }
        
        // Buscar siguiente fila no vacía
        inicioTabla = i + 1;
        while (inicioTabla < datos.length && this.esFilaVacia(datos[inicioTabla])) {
          inicioTabla++;
        }
        i = inicioTabla - 1;
        filaVaciaConsecutiva = 0;
      }
    }
    
    return tablas;
  }

  /**
   * Verifica si una fila está vacía o solo contiene espacios en blanco
   */
  private esFilaVacia(fila: any[]): boolean {
    if (!fila || fila.length === 0) return true;
    
    return fila.every(celda => {
      if (celda === null || celda === undefined) return true;
      const valorString = celda.toString().trim();
      return valorString === '';
    });
  }
  
  /**
   * Verifica si una columna está vacía en todas las filas
   */
  private esColumnaVacia(datos: any[][], columna: number): boolean {
    return datos.every(fila => {
      if (!fila || columna >= fila.length) return true;
      const celda = fila[columna];
      if (celda === null || celda === undefined) return true;
      return celda.toString().trim() === '';
    });
  }
  
  /**
   * Extrae datos de un rango de columnas específico
   */
  private extraerDatosColumnas(datos: any[][], inicioCol: number, finCol: number): any[][] {
    return datos.map(fila => {
      const filaExtraida = [];
      for (let col = inicioCol; col < finCol; col++) {
        filaExtraida.push(fila[col] || '');
      }
      return filaExtraida;
    }).filter(fila => fila.some(celda => celda && celda.toString().trim() !== ''));
  }
  
  /**
   * Verifica si una tabla tiene contenido válido
   */
  private tieneContenidoValido(datos: any[][]): boolean {
    if (!datos || datos.length === 0) return false;
    
    // Debe tener al menos una fila con contenido real
    return datos.some(fila => 
      fila.some(celda => 
        celda !== null && 
        celda !== undefined && 
        celda.toString().trim() !== ''
      )
    );
  }
  


  /**
   * Limpia los datos de una tabla removiendo filas completamente vacías
   */
  private limpiarDatosTabla(datos: any[][]): any[][] {
    return datos.filter(fila => !this.esFilaVacia(fila));
  }

  /**
   * Genera un título descriptivo para una tabla basado en sus headers
   */
  private generarTituloTabla(headers: any[], numeroTabla: number): string {
    if (!headers || headers.length === 0) {
      return `Tabla ${numeroTabla}`;
    }
    
    // Intentar generar un título más descriptivo basado en los headers
    const headersTexto = headers
      .filter(h => h && h.toString().trim() !== '')
      .map(h => h.toString().trim())
      .slice(0, 3); // Máximo 3 headers para el título
    
    if (headersTexto.length === 0) {
      return `Tabla ${numeroTabla}`;
    }
    
    // Si hay palabras clave comunes, usarlas para el título
    const palabrasClave = ['ventas', 'ingresos', 'gastos', 'empleados', 'productos', 'clientes'];
    const palabraEncontrada = headersTexto.find(header => 
      palabrasClave.some(palabra => 
        header.toLowerCase().includes(palabra)
      )
    );
    
    if (palabraEncontrada) {
      return `Tabla de ${palabraEncontrada}`;
    }
    
    // Generar título basado en los primeros headers
    if (headersTexto.length === 1) {
      return `Tabla: ${headersTexto[0]}`;
    }
    
    return `Tabla ${numeroTabla} (${headersTexto[0]}, ${headersTexto[1]}...)`;
  }
}