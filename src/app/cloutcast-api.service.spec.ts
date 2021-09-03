import { TestBed } from '@angular/core/testing';

import { CloutcastApiService } from './cloutcast-api.service';

describe('CloutcastApiService', () => {
  let service: CloutcastApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloutcastApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
