import { TestBed } from '@angular/core/testing';
import { TemplateCompiler } from './template-compiler';

describe('TemplateCompiler', () => {
  let service: TemplateCompiler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateCompiler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
