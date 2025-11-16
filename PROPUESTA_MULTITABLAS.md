# Propuesta: Detección Automática de Múltiples Tablas en Excel

## 🎯 Objetivo
Mejorar el sistema para detectar automáticamente cuando un archivo Excel contiene múltiples tablas separadas y crear un contenedor individual para cada una.

## 📊 Análisis Actual
- **Problema**: Un archivo Excel con múltiples tablas se muestra como una sola tabla grande
- **Limitación**: Solo se lee la primera hoja y se trata todo como una tabla única
- **Impacto**: Dificulta la visualización y comprensión de datos estructurados en secciones

## ✅ Propuesta de Solución

### 1. Modelo de Datos Extendido
```typescript
export interface TablaExcel {
  titulo?: string;
  datos: any[][];
  inicioFila: number;
  finFila: number;
  id: string;
}

export interface ArchivoExcel {
  nombre: string;
  tablas: TablaExcel[];  // Cambio: array de tablas en lugar de datos únicos
  tituloPersonalizado?: string;
  timestamp?: number;
  // Mantener compatibilidad hacia atrás
  datos?: any[][];  // Deprecated - solo para archivos antiguos
}
```

### 2. Algoritmo de Detección
```typescript
detectarTablas(datos: any[][]): TablaExcel[] {
  const tablas: TablaExcel[] = [];
  let inicioTabla = 0;
  
  for (let i = 0; i < datos.length; i++) {
    const filaVacia = datos[i].every(celda => !celda || celda.toString().trim() === '');
    
    if (filaVacia || i === datos.length - 1) {
      // Encontramos separador o fin de archivo
      if (i - inicioTabla > 1) { // Al menos header + 1 fila de datos
        const datosTabla = datos.slice(inicioTabla, i === datos.length - 1 ? i + 1 : i);
        
        tablas.push({
          titulo: this.generarTituloTabla(datosTabla[0], tablas.length + 1),
          datos: datosTabla,
          inicioFila: inicioTabla,
          finFila: i === datos.length - 1 ? i : i - 1,
          id: `tabla_${tablas.length + 1}`
        });
      }
      inicioTabla = i + 1;
    }
  }
  
  return tablas.length > 0 ? tablas : [{
    titulo: 'Tabla Principal',
    datos: datos,
    inicioFila: 0,
    finFila: datos.length - 1,
    id: 'tabla_1'
  }];
}
```

### 3. Beneficios
- ✅ **Mejor organización**: Cada tabla se muestra en su propio contenedor
- ✅ **Navegación mejorada**: Fácil identificación de diferentes secciones de datos
- ✅ **Gráficas específicas**: Crear gráficas de tablas individuales
- ✅ **Compatibilidad**: Mantiene funcionamiento con archivos existentes
- ✅ **Flexibilidad**: Configuración manual opcional

### 4. Casos de Uso Típicos
1. **Reportes financieros**: Ingresos, Gastos, Balance (3 tablas separadas)
2. **Datos por departamentos**: Una tabla por cada departamento
3. **Series temporales**: Datos mensuales/trimestrales en tablas separadas
4. **Comparativas**: Antes/Después, Real/Presupuesto

### 5. Implementación por Fases
**Fase 1**: Algoritmo de detección básico (filas vacías)
**Fase 2**: Detección avanzada (cambios en estructura)
**Fase 3**: Configuración manual de separación
**Fase 4**: Preview antes de importar

## 🔧 Compatibilidad
- Los archivos existentes seguirán funcionando
- Migración automática en próximas cargas
- Opción de "Ver como tabla única" disponible