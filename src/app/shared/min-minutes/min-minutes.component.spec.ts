import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinMinutesComponent } from './min-minutes.component';

describe('MinMinutesComponent', () => {
  let component: MinMinutesComponent;
  let fixture: ComponentFixture<MinMinutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MinMinutesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MinMinutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
