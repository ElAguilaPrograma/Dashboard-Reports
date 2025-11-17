export interface TablaExcel {
  titulo?: string;
  datos: any[][];
  inicioFila: number;
  finFila: number;
  id: string;
}

export interface ArchivoExcel {
  nombre: string;
  datos: any[][]; // Mantener para compatibilidad
  tablas?: TablaExcel[]; // Nuevo: array de tablas detectadas
  tituloPersonalizado?: string;
  timestamp?: number;
  esMultiTabla?: boolean; // Flag para identificar archivos con múltiples tablas
}

export interface Imagen {
  nombre: string;
  datos: string; // Base64
}

export interface Grafica {
  tipo: 'bar' | 'line' | 'pie' | 'radar';
  datos: any[];
  columnas: string[];
  excelIndex: number;
  nombreExcel: string;
  tituloPersonalizado?: string; // Nombre personalizado para mostrar
}

export interface TarjetaTexto {
  id: string;
  titulo: string;
  contenido: string;
  timestamp?: number;
}

export interface SubNivel {
  id: string;
  titulo: string;
  descripcion: string;
  archivosExcel: ArchivoExcel[];
  imagenes: Imagen[];
  graficas: Grafica[];
  tarjetasTexto?: TarjetaTexto[];
}

export interface Nivel {
  id: string;
  titulo: string;
  collapsed: boolean;
  subniveles: SubNivel[];
}

export interface Planta {
  id: number;
  nombre: string;
  niveles: Nivel[];
}