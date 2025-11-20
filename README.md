# Dashboard de Informes de Plantas 🏭

<div align="center">

**Aplicación de escritorio multiplataforma para la creación, visualización y gestión de informes de seguridad industrial**

[![Angular](https://img.shields.io/badge/Angular-20.3-red.svg)](https://angular.io/)
[![Electron](https://img.shields.io/badge/Electron-39.1-blue.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

## 📋 Descripción

**Informe Plantas Dashboard** es una aplicación de escritorio desarrollada con Angular y Electron que permite crear, gestionar y visualizar informes estructurados para múltiples plantas industriales. La aplicación está diseñada específicamente para facilitar la documentación de evaluaciones de seguridad industrial, capacitaciones y cumplimiento normativo.

### Características Principales

✨ **Gestión Multi-Planta**: Organización jerárquica con soporte para 4 plantas y 5 niveles de evaluación por planta
📊 **Visualización de Datos**: Integración de tablas Excel, gráficas interactivas (barras, líneas, pastel, radar) e imágenes
🎨 **Editor Visual**: Interface intuitiva con drag-and-drop para organizar contenido
💾 **Persistencia Local**: Almacenamiento automático de datos en el sistema local
📤 **Exportación/Importación**: Funcionalidad completa para backup y migración de configuraciones
🖼️ **Gestión de Imágenes**: Soporte para imágenes individuales y creación de collages
📈 **Gráficas Dinámicas**: Generación automática de gráficas a partir de datos Excel
📝 **Tarjetas de Texto**: Notas y anotaciones personalizadas para cada sección

## 🏗️ Arquitectura

```
Dashboard de Informes
├── 4 Plantas Industriales
│   └── 5 Niveles por Planta
│       ├── Conceptos a evaluar
│       ├── Capacitación
│       ├── Condiciones y actos inseguros
│       ├── Productos químicos cumplimiento NOM-018
│       └── Ergonomía y manos seguras
│           └── 5 Subniveles por Nivel
│               ├── Archivos Excel (multi-tabla)
│               ├── Imágenes y Collages
│               ├── Gráficas Interactivas
│               └── Tarjetas de Texto
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Angular CLI** 20.x
- **Electron** 39.x

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/ElAguilaPrograma/Dashboard-Reports.git
cd informe-plantas
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en modo desarrollo**
```bash
# Servidor de desarrollo Angular
npm start

# Aplicación Electron con recarga en caliente
npm run electron:dev
```

La aplicación estará disponible en `http://localhost:4200` (navegador) o se abrirá automáticamente en Electron.

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
npm start                    # Servidor de desarrollo Angular
npm run electron:dev        # Desarrollo Electron con hot-reload
npm run electron           # Ejecutar Electron en modo standalone
```

### Compilación

```bash
npm run build              # Build de producción Angular
npm run build:prod         # Build optimizado para producción
npm run build:electron     # Build específico para Electron
```

### Distribución

```bash
npm run electron:build     # Compilar y crear instalador
npm run electron:dist      # Crear distribución sin publicar
npm run electron:test      # Probar build de producción
```

Los archivos de distribución se generarán en la carpeta `release/` con los siguientes formatos:
- **Portable**: `.exe` ejecutable sin instalación
- **NSIS**: Instalador con asistente completo
- **MSI**: Instalador Windows nativo
- **ZIP**: Archivo comprimido portátil

## 📦 Tecnologías Utilizadas

### Frontend
- **Angular 20.3** - Framework principal
- **Angular Material** - Componentes UI
- **Bootstrap 5.3** - Estilos y layout responsive
- **Chart.js 4.5** - Visualización de gráficas
- **ng2-charts** - Integración Angular-Chart.js

### Backend/Persistencia
- **Electron 39.1** - Aplicación de escritorio
- **Node.js** - Runtime de JavaScript
- **IPC (Inter-Process Communication)** - Comunicación Electron

### Procesamiento de Datos
- **XLSX (SheetJS)** - Lectura y procesamiento de archivos Excel
- **RxJS 7.8** - Programación reactiva
- **TypeScript 5.9** - Tipado estático

### Herramientas de Desarrollo
- **Electron Builder** - Empaquetado y distribución
- **Karma + Jasmine** - Testing
- **Concurrently** - Ejecución paralela de procesos

## 📂 Estructura del Proyecto

```
informe-plantas/
├── src/
│   ├── app/
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── dialog-**/      # Diálogos modales
│   │   │   ├── grafica-viewer/ # Visualizador de gráficas
│   │   │   ├── header/         # Barra superior
│   │   │   └── sidebar/        # Panel lateral de navegación
│   │   ├── models/             # Interfaces TypeScript
│   │   ├── services/           # Servicios Angular
│   │   │   ├── report-state.service.ts    # Estado global
│   │   │   ├── excel.service.ts           # Procesamiento Excel
│   │   │   ├── storage.service.ts         # Persistencia
│   │   │   └── sidebar.service.ts         # Control sidebar
│   │   └── app.component.*     # Componente principal
│   ├── assets/                 # Recursos estáticos
│   └── styles.css              # Estilos globales
├── electron/
│   ├── main.js                 # Proceso principal Electron
│   └── preload.js              # Script de precarga
├── public/                     # Archivos públicos
├── release/                    # Distribuciones generadas
└── package.json                # Configuración del proyecto
```

## 🎯 Funcionalidades Principales

### 1. Gestión de Contenido

#### Archivos Excel
- **Importación**: Carga de archivos `.xlsx` y `.xls`
- **Multi-tabla**: Detección automática de múltiples tablas en una hoja
- **Visualización**: Tablas responsivas con formato automático
- **Actualización**: Reemplazo dinámico de datos manteniendo gráficas
- **Ordenamiento**: Ordenación por columnas con detección de tipos

#### Gráficas Dinámicas
- **Tipos soportados**: Barras, líneas, pastel (pie), radar
- **Configuración flexible**: Selección de columnas y tipos de gráfica
- **Interactividad**: Zoom, tooltips, leyendas personalizables
- **Actualización automática**: Recalculo al actualizar fuente de datos
- **Vista expandida**: Modal de pantalla completa para análisis detallado

#### Imágenes y Collages
- **Formatos**: JPG, PNG, GIF, SVG
- **Vista previa**: Thumbnails optimizados
- **Collages**: Creación de composiciones con múltiples imágenes
- **Metadatos**: Información de tamaño y dimensiones
- **Expansión**: Modal de visualización en alta resolución

#### Tarjetas de Texto
- **Editor simple**: Títulos y contenido personalizado
- **Markdown-like**: Formato básico de texto
- **Timestamps**: Seguimiento de creación/modificación

### 2. Navegación y Organización

- **Selector de Plantas**: Navegación rápida entre plantas
- **Árbol de Niveles**: Estructura colapsable de 5 niveles
- **Sidebar Responsive**: Panel lateral con toggle
- **Breadcrumbs**: Indicador de ubicación actual

### 3. Persistencia y Backup

#### Almacenamiento Local
```typescript
// Ubicación de datos
Windows: %APPDATA%/informe-plantas/informes.json
macOS: ~/Library/Application Support/informe-plantas/
Linux: ~/.config/informe-plantas/
```

#### Exportación/Importación
- **Exportar Configuración**: Backup completo en formato JSON
- **Importar y Reemplazar**: Restauración completa de configuración
- **Limpiar Entorno**: Reset completo a estado inicial

### 4. Interface de Usuario

- **Material Design**: Componentes Angular Material
- **Responsive**: Adaptación a diferentes tamaños de pantalla
- **Dark Mode Ready**: Preparado para modo oscuro
- **Drag & Drop**: Reorganización visual de elementos (próximamente)
- **Modales**: Diálogos para operaciones críticas

## 🔧 Configuración Avanzada

### Configuración de Electron Builder

El archivo `package.json` incluye configuración para múltiples formatos de distribución:

```json
{
  "build": {
    "appId": "com.empresa.informe-plantas",
    "productName": "Informe Plantas Dashboard",
    "win": {
      "target": ["portable", "nsis", "msi", "zip"]
    }
  }
}
```

### Variables de Entorno

```bash
# Modo de desarrollo
NODE_ENV=development npm run electron

# Modo de producción
NODE_ENV=production npm run electron:prod
```

## 📊 Modelo de Datos

### Estructura Principal

```typescript
interface Planta {
  id: number;
  nombre: string;
  niveles: Nivel[];
}

interface Nivel {
  id: string;
  titulo: string;
  collapsed: boolean;
  subniveles: SubNivel[];
}

interface SubNivel {
  id: string;
  titulo: string;
  descripcion: string;
  archivosExcel: ArchivoExcel[];
  imagenes: Imagen[];
  graficas: Grafica[];
  tarjetasTexto: TarjetaTexto[];
}
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

## 🐛 Solución de Problemas

### La aplicación no inicia en Electron

**Problema**: Pantalla en blanco al ejecutar `npm run electron:dev`

**Solución**:
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run electron:dev
```

### Errores al leer archivos Excel

**Problema**: "Error al cargar Excel"

**Solución**: Asegúrate de que el archivo Excel:
- No esté abierto en otra aplicación
- Tenga formato válido `.xlsx` o `.xls`
- No contenga macros o contenido protegido

### Build de Electron falla

**Problema**: Error en `electron-builder`

**Solución**:
```bash
# Limpiar carpeta de release
rm -rf release/

# Ejecutar postinstall manualmente
npm run postinstall

# Intentar build nuevamente
npm run electron:build
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Sistema de plantillas para informes
- [ ] Exportación a PDF con diseño personalizable
- [ ] Gráficas de tendencias temporales
- [ ] Sistema de usuarios y permisos
- [ ] Sincronización en la nube
- [ ] Modo oscuro completo
- [ ] Soporte multiidioma (i18n)
- [ ] Dashboard de métricas agregadas

## 👤 Autor

**ElAguilaPrograma**

- GitHub: [@ElAguilaPrograma](https://github.com/ElAguilaPrograma)
- Repositorio: [Dashboard-Reports](https://github.com/ElAguilaPrograma/Dashboard-Reports)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Angular Team](https://angular.io) por el excelente framework
- [Electron Team](https://www.electronjs.org) por facilitar el desarrollo desktop
- [Chart.js](https://www.chartjs.org) por las visualizaciones de datos
- [SheetJS](https://sheetjs.com) por el procesamiento de Excel
- Comunidad de desarrolladores de código abierto

---

<div align="center">

**Hecho con ❤️ para la industria**

[Reportar Bug](https://github.com/ElAguilaPrograma/Dashboard-Reports/issues) · [Solicitar Feature](https://github.com/ElAguilaPrograma/Dashboard-Reports/issues)

</div>
