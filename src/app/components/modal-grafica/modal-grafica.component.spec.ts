import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGraficaComponent } from './modal-grafica.component';

describe('ModalGraficaComponent', () => {
  let component: ModalGraficaComponent;
  let fixture: ComponentFixture<ModalGraficaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalGraficaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGraficaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
