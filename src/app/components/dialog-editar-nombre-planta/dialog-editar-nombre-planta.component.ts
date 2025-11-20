import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogEditarNombrePlantaData {
  nombreActual: string;
  nombrePersonalizado?: string;
}

@Component({
  selector: 'app-dialog-editar-nombre-planta',
  standalone: false,
  templateUrl: './dialog-editar-nombre-planta.component.html',
  styleUrls: ['./dialog-editar-nombre-planta.component.css']
})
export class DialogEditarNombrePlantaComponent {
  nombrePersonalizado: string;

  constructor(
    public dialogRef: MatDialogRef<DialogEditarNombrePlantaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogEditarNombrePlantaData
  ) {
    this.nombrePersonalizado = data.nombrePersonalizado || data.nombreActual;
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    if (this.nombrePersonalizado && this.nombrePersonalizado.trim()) {
      this.dialogRef.close(this.nombrePersonalizado.trim());
    }
  }

  onRestaurar(): void {
    // Restaurar al nombre original
    this.dialogRef.close(null);
  }
}
