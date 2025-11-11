import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficaViewerComponent } from './grafica-viewer.component';

describe('GraficaViewerComponent', () => {
  let component: GraficaViewerComponent;
  let fixture: ComponentFixture<GraficaViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraficaViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficaViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
