import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionSelectComponent } from './position-select.component';

describe('PositionSelectComponent', () => {
  let component: PositionSelectComponent;
  let fixture: ComponentFixture<PositionSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PositionSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
