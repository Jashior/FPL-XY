import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerExcludeComponent } from './player-exclude.component';

describe('PlayerExcludeComponent', () => {
  let component: PlayerExcludeComponent;
  let fixture: ComponentFixture<PlayerExcludeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerExcludeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerExcludeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
