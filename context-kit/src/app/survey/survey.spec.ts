import { TestBed } from '@angular/core/testing';
import { Survey } from './survey';

describe('Survey', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Survey] }).compileComponents();
  });

  it('shows only the fields for the chosen track', () => {
    const fixture = TestBed.createComponent(Survey);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.track.setValue('research');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#research-heading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#app-heading')).toBeFalsy();
    expect(fixture.componentInstance.form.controls.research.enabled).toBe(true);
    expect(fixture.componentInstance.form.controls.app.disabled).toBe(true);

    fixture.componentInstance.form.controls.track.setValue('app');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#app-heading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#research-heading')).toBeFalsy();
    expect(fixture.componentInstance.form.controls.app.enabled).toBe(true);
    expect(fixture.componentInstance.form.controls.research.disabled).toBe(true);
  });

  it('publishes valid answers after all required fields are filled', () => {
    const fixture = TestBed.createComponent(Survey);
    fixture.detectChanges();
    fixture.componentInstance.form.patchValue({
      track: 'research',
      userName: 'Sam',
      projectName: 'Bird study',
      goal: 'Understand local migration patterns.',
    });
    expect(fixture.componentInstance.valid()).toBe(true);
    expect(fixture.componentInstance.answers().tools).toEqual(['claude-code']);
  });
});
