import { TestBed } from '@angular/core/testing';
import { ZipGenerator } from './zip-generator';

describe('ZipGenerator', () => {
  let service: ZipGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZipGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
