import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogEditarTituloData {
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-dialog-editar-titulo',
  standalone: false,
  templateUrl: './dialog-editar-titulo.component.html',
  styleUrl: './dialog-editar-titulo.component.css',
})
export class DialogEditarTituloComponent {
  titulo: string;
  descripcion: string;

  constructor(
    public dialogRef: MatDialogRef<DialogEditarTituloComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogEditarTituloData
  ) {
    this.titulo = data.titulo || '';
    this.descripcion = data.descripcion || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.titulo.trim()) {
      this.dialogRef.close({
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim()
      });
    }
  }
}
