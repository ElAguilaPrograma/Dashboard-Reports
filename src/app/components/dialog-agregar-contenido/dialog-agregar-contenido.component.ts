import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogAgregarContenidoData {
  tipo: 'excel' | 'imagenes' | 'collage' | 'texto' | null;
  datos?: any;
}

@Component({
  selector: 'app-dialog-agregar-contenido',
  standalone: false,
  templateUrl: './dialog-agregar-contenido.component.html',
  styleUrl: './dialog-agregar-contenido.component.css',
})
export class DialogAgregarContenidoComponent {
  tipoSeleccionado: 'excel' | 'imagenes' | 'collage' | 'texto' | null = null;
  
  // Para tarjeta de texto
  tituloTexto: string = '';
  contenidoTexto: string = '';

  constructor(
    public dialogRef: MatDialogRef<DialogAgregarContenidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogAgregarContenidoData
  ) {}

  seleccionarTipo(tipo: 'excel' | 'imagenes' | 'collage' | 'texto'): void {
    this.tipoSeleccionado = tipo;
  }

  onExcelSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.dialogRef.close({
        tipo: 'excel',
        archivo: file
      });
    }
  }

  onImagenesSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.dialogRef.close({
        tipo: 'imagenes',
        archivos: Array.from(files)
      });
    }
  }

  onCrearCollage(): void {
    this.dialogRef.close({
      tipo: 'collage'
    });
  }

  onConfirmarTexto(): void {
    if (this.tituloTexto.trim()) {
      this.dialogRef.close({
        tipo: 'texto',
        titulo: this.tituloTexto.trim(),
        contenido: this.contenidoTexto.trim()
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
