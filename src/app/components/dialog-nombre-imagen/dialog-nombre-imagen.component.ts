import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogNombreImagenData {
  nombreSugerido: string;
  cantidadImagenes: number;
}

@Component({
  selector: 'app-dialog-nombre-imagen',
  standalone: false,
  templateUrl: './dialog-nombre-imagen.component.html',
  styleUrls: ['./dialog-nombre-imagen.component.css']
})
export class DialogNombreImagenComponent {
  nombreElemento: string;
  crearCollage: boolean = false;
  cantidadImagenes: number;

  constructor(
    public dialogRef: MatDialogRef<DialogNombreImagenComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogNombreImagenData
  ) {
    this.nombreElemento = data.nombreSugerido || '';
    this.cantidadImagenes = data.cantidadImagenes || 1;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.nombreElemento.trim()) {
      this.dialogRef.close({
        nombre: this.nombreElemento.trim(),
        crearCollage: this.crearCollage && this.cantidadImagenes > 1
      });
    }
  }
}

