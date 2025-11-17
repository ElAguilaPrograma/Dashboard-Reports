import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogNombreGraficaData {
  nombreSugerido: string;
}

@Component({
  selector: 'app-dialog-nombre-grafica',
  standalone: false,
  templateUrl: './dialog-nombre-grafica.component.html',
  styleUrls: ['./dialog-nombre-grafica.component.css']
})
export class DialogNombreGraficaComponent {
  nombreElemento: string;

  constructor(
    public dialogRef: MatDialogRef<DialogNombreGraficaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogNombreGraficaData
  ) {
    this.nombreElemento = data.nombreSugerido || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.nombreElemento.trim()) {
      this.dialogRef.close(this.nombreElemento.trim());
    }
  }
}


