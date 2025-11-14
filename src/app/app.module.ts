import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

// Registrar todos los módulos de Chart.js
Chart.register(...registerables);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ModalGraficaComponent } from './components/modal-grafica/modal-grafica.component';
import { GraficaViewerComponent } from './components/grafica-viewer/grafica-viewer.component';
import { DialogNombreExcelComponent } from './components/dialog-nombre-excel/dialog-nombre-excel.component';
import { DialogNombreImagenComponent } from './components/dialog-nombre-imagen/dialog-nombre-imagen.component';
import { DialogNombreGraficaComponent } from './components/dialog-nombre-grafica/dialog-nombre-grafica.component';
import { DialogCollageComponent } from './components/dialog-collage/dialog-collage.component';

@NgModule({
  declarations: [
    AppComponent,
    ModalGraficaComponent,
    GraficaViewerComponent,
    DialogNombreExcelComponent,
    DialogNombreImagenComponent,
    DialogNombreGraficaComponent,
    DialogCollageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    BaseChartDirective
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
