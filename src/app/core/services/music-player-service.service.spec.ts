import { TestBed } from '@angular/core/testing';

import { MusicPlayerServiceService } from './music-player-service.service';

describe('MusicPlayerServiceService', () => {
  let service: MusicPlayerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MusicPlayerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
