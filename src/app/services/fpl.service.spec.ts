import { TestBed } from '@angular/core/testing';

import { FplService } from './fpl.service';

describe('FplService', () => {
  let service: FplService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FplService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
