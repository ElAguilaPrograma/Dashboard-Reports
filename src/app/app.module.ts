import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ModalGraficaComponent } from './components/modal-grafica/modal-grafica.component';
import { GraficaViewerComponent } from './components/grafica-viewer/grafica-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    ModalGraficaComponent,
    GraficaViewerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    BaseChartDirective
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
