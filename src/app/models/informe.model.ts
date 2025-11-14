export interface ArchivoExcel {
  nombre: string;
  datos: any[][];
}

export interface Imagen {
  nombre: string;
  datos: string; // Base64
}

export interface Grafica {
  tipo: 'bar' | 'line';
  datos: any[];
  columnas: string[];
  excelIndex: number;
  nombreExcel: string;
  tituloPersonalizado?: string; // Nombre personalizado para mostrar
}

export interface SubNivel {
  id: string;
  titulo: string;
  descripcion: string;
  archivosExcel: ArchivoExcel[];
  imagenes: Imagen[];
  graficas: Grafica[];
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