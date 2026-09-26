import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AiTool,
  AnswerStyle,
  Budget,
  DEFAULT_ANSWERS,
  Experience,
  KitAnswers,
  LaunchTarget,
  OutputType,
  Platform,
  ProjectStatus,
  RequirementAnswer,
  ResearchPurpose,
  SourceType,
  Track,
  WebAccess,
  YesNo,
  isComplete,
} from '../kit/kit-answers';

type CheckboxMap<T extends string> = { [K in T]: FormControl<boolean> };

const checkboxGroup = <T extends string>(options: readonly T[], selected: readonly T[]) =>
  new FormGroup(
    Object.fromEntries(options.map((option) => [option, new FormControl(selected.includes(option), { nonNullable: true })])) as CheckboxMap<T>,
  );

@Component({
  selector: 'app-survey',
  imports: [ReactiveFormsModule],
  templateUrl: './survey.html',
})
export class Survey {
  private readonly destroyRef = inject(DestroyRef);

  readonly answers = signal<KitAnswers>({ ...DEFAULT_ANSWERS });
  readonly valid = signal(false);
  readonly answersChange = output<KitAnswers>();
  readonly validChange = output<boolean>();

  readonly form = new FormGroup({
    track: new FormControl<Track>('', { nonNullable: true, validators: Validators.required }),
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(40)] }),
    assistantName: new FormControl('Kit', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9 '\-]+$/)],
    }),
    experience: new FormControl<Experience>('new', { nonNullable: true }),
    tools: checkboxGroup<AiTool>(['claude-code', 'cursor', 'other'], ['claude-code']),
    projectName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    goal: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(400)] }),
    deadline: new FormControl('', { nonNullable: true }),
    research: new FormGroup({
      researchPurpose: new FormControl<ResearchPurpose>('learning', { nonNullable: true }),
      answerStyle: new FormControl<AnswerStyle>('detailed', { nonNullable: true }),
      sourceTypes: checkboxGroup<SourceType>(
        ['papers', 'web-articles', 'books-notes', 'datasets', 'code-repositories', 'images', 'videos-transcripts'],
        [],
      ),
      outputs: checkboxGroup<OutputType>(['reports', 'slides', 'charts'], ['reports']),
      webAccess: new FormControl<WebAccess>('ask', { nonNullable: true }),
      usesObsidian: new FormControl<YesNo>('yes', { nonNullable: true }),
    }),
    app: new FormGroup({
      projectStatus: new FormControl<ProjectStatus>('new', { nonNullable: true }),
      audience: new FormControl('', { nonNullable: true, validators: Validators.maxLength(150) }),
      platform: new FormControl<Platform>('unsure', { nonNullable: true }),
      launchTarget: new FormControl<LaunchTarget>('unsure', { nonNullable: true }),
      needsAccounts: new FormControl<RequirementAnswer>('unsure', { nonNullable: true }),
      storesData: new FormControl<RequirementAnswer>('unsure', { nonNullable: true }),
      personalData: new FormControl<RequirementAnswer>('unsure', { nonNullable: true }),
      payments: new FormControl<RequirementAnswer>('unsure', { nonNullable: true }),
      externalServices: new FormControl('', { nonNullable: true, validators: Validators.maxLength(200) }),
      budget: new FormControl<Budget>('free', { nonNullable: true }),
      techStack: new FormControl('', { nonNullable: true, validators: Validators.maxLength(200) }),
    }),
  });

  constructor() {
    this.form.controls.research.disable({ emitEvent: false });
    this.form.controls.app.disable({ emitEvent: false });
    this.form.controls.track.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((track) => {
      if (track === 'research') {
        this.form.controls.research.enable({ emitEvent: false });
        this.form.controls.app.disable({ emitEvent: false });
      } else if (track === 'app') {
        this.form.controls.app.enable({ emitEvent: false });
        this.form.controls.research.disable({ emitEvent: false });
      } else {
        this.form.controls.research.disable({ emitEvent: false });
        this.form.controls.app.disable({ emitEvent: false });
      }
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.publish());
    queueMicrotask(() => this.publish());
  }

  private selected<T extends string>(values: Record<T, boolean>): T[] {
    return (Object.keys(values) as T[]).filter((key) => values[key]);
  }

  private publish(): void {
    const value = this.form.getRawValue();
    const answers: KitAnswers = {
      track: value.track,
      userName: value.userName,
      assistantName: value.assistantName,
      experience: value.experience,
      tools: this.selected(value.tools),
      projectName: value.projectName,
      goal: value.goal,
      deadline: value.deadline,
      researchPurpose: value.research.researchPurpose,
      answerStyle: value.research.answerStyle,
      sourceTypes: this.selected(value.research.sourceTypes),
      outputs: this.selected(value.research.outputs),
      webAccess: value.research.webAccess,
      usesObsidian: value.research.usesObsidian,
      projectStatus: value.app.projectStatus,
      audience: value.app.audience,
      platform: value.app.platform,
      launchTarget: value.app.launchTarget,
      needsAccounts: value.app.needsAccounts,
      storesData: value.app.storesData,
      personalData: value.app.personalData,
      payments: value.app.payments,
      externalServices: value.app.externalServices,
      budget: value.app.budget,
      techStack: value.app.techStack,
    };
    const valid = this.form.valid && isComplete(answers);
    this.answers.set(answers);
    this.valid.set(valid);
    this.answersChange.emit(answers);
    this.validChange.emit(valid);
  }
}
