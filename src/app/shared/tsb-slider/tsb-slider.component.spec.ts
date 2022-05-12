import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsbSliderComponent } from './tsb-slider.component';

describe('TsbSliderComponent', () => {
  let component: TsbSliderComponent;
  let fixture: ComponentFixture<TsbSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TsbSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TsbSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
