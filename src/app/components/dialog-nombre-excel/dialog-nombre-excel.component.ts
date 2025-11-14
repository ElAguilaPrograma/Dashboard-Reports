import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogNombreExcelData {
  nombreSugerido: string;
}

@Component({
  selector: 'app-dialog-nombre-excel',
  standalone: false,
  templateUrl: './dialog-nombre-excel.component.html',
  styleUrls: ['./dialog-nombre-excel.component.css']
})
export class DialogNombreExcelComponent {
  nombreElemento: string;

  constructor(
    public dialogRef: MatDialogRef<DialogNombreExcelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogNombreExcelData
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

