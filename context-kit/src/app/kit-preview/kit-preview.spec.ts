import { TestBed } from '@angular/core/testing';
import { KitFile } from '../kit/kit-file';
import { KitPreview } from './kit-preview';

describe('KitPreview', () => {
  const files: KitFile[] = [
    { path: 'START-HERE.md', content: 'Welcome to your kit.' },
    { path: 'context/state.md', content: 'Current state content.' },
    { path: 'wiki/index.md', content: 'Research wiki index.' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KitPreview] }).compileComponents();
  });

  it('groups files and switches the rendered content on click', async () => {
    const fixture = TestBed.createComponent(KitPreview);
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Project root');
    expect(element.textContent).toContain('context');
    expect(element.querySelector('pre')?.textContent).toContain('Welcome to your kit.');

    const stateButton = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('state.md'),
    );
    stateButton?.click();
    fixture.detectChanges();
    expect(element.querySelector('pre')?.textContent).toContain('Current state content.');
  });
});
