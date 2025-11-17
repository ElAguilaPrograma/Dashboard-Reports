import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Imagen } from '../../models/informe.model';

export interface DialogCollageData {
  imagenes: Imagen[];
  nombreSugerido: string;
}

@Component({
  selector: 'app-dialog-collage',
  standalone: false,
  templateUrl: './dialog-collage.component.html',
  styleUrls: ['./dialog-collage.component.css']
})
export class DialogCollageComponent implements OnInit {
  nombreElemento: string;
  imagenes: Imagen[] = [];
  imagenesSeleccionadas: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogCollageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogCollageData
  ) {
    this.nombreElemento = data.nombreSugerido || 'Collage de imágenes';
    this.imagenes = data.imagenes || [];
  }

  ngOnInit() {
  }

  toggleImagen(index: number) {
    const idx = this.imagenesSeleccionadas.indexOf(index);
    if (idx > -1) {
      this.imagenesSeleccionadas.splice(idx, 1);
    } else {
      this.imagenesSeleccionadas.push(index);
    }
  }

  esImagenSeleccionada(index: number): boolean {
    return this.imagenesSeleccionadas.includes(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.imagenesSeleccionadas.length < 2 || !this.nombreElemento.trim()) {
      return;
    }
    this.dialogRef.close({
      nombre: this.nombreElemento.trim(),
      indices: this.imagenesSeleccionadas.sort((a, b) => a - b)
    });
  }
}


