import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';
import { KitPreview } from './kit-preview/kit-preview';
import { Survey } from './survey/survey';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Context Kit heading', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Context Kit');
  });

  it('disables download and lists missing fields on an empty form', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>('.primary-button');

    expect(button?.disabled).toBe(true);
    expect(compiled.textContent).toContain('Answer the required questions to preview your kit');
    expect(compiled.textContent).toContain('Your name');
    expect(compiled.textContent).toContain('Project name');
    expect(compiled.textContent).toContain('Project goal');
  });

  it('shows the assistant name once both names are entered', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const survey = fixture.debugElement.query(By.directive(Survey)).componentInstance as Survey;
    survey.form.patchValue({ userName: 'Rae', assistantName: 'Nova' });
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('#preview-heading')?.textContent,
    ).toContain('Meet Nova');
  });

  it('previews the expected files for valid research answers', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const survey = fixture.debugElement.query(By.directive(Survey)).componentInstance as Survey;

    survey.form.patchValue({
      track: 'research',
      userName: 'Rae',
      assistantName: 'Nova',
      projectName: 'Sleep research',
      goal: 'Understand how sleep habits affect concentration.',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const preview = fixture.debugElement.query(By.directive(KitPreview))
      .componentInstance as KitPreview;
    const paths = preview.files().map((file) => file.path);
    expect(paths).toContain('START-HERE.md');
    expect(paths).toContain('wiki/index.md');
  });
});
