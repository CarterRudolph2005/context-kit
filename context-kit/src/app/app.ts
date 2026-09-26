import { Component, computed, inject, signal } from '@angular/core';
import { TemplateCompiler } from './core/services/template-compiler';
import { ZipGenerator } from './core/services/zip-generator';
import { KitAnswers } from './kit/kit-answers';
import { KitPreview } from './kit-preview/kit-preview';
import { Survey } from './survey/survey';

@Component({
  selector: 'app-root',
  imports: [Survey, KitPreview],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly compiler = inject(TemplateCompiler);
  private readonly zipGenerator = inject(ZipGenerator);

  readonly answers = signal<KitAnswers | null>(null);
  readonly valid = signal(false);
  readonly downloading = signal(false);
  readonly files = computed(() => {
    const answers = this.answers();
    return answers && this.valid() ? this.compiler.compile(answers) : [];
  });
  readonly missingFields = computed(() => {
    const answers = this.answers();
    if (!answers) return ['What are you working on?', 'Your name', 'Project name', 'Project goal'];

    const missing: string[] = [];
    if (!answers.track) missing.push('What are you working on?');
    const userName = answers.userName.trim();
    const assistantName = answers.assistantName.trim();
    const projectName = answers.projectName.trim();
    const goal = answers.goal.trim();
    if (!userName || userName.length > 40) missing.push('Your name');
    if (!assistantName || assistantName.length > 30 || !/^[A-Za-z0-9 '\-]+$/.test(assistantName)) {
      missing.push("Your AI's name");
    }
    if (!answers.tools.length) missing.push('At least one AI tool');
    if (!projectName || projectName.length > 60) missing.push('Project name');
    if (!goal || goal.length > 400) missing.push('Project goal');
    return missing;
  });
  readonly previewHeading = computed(() => {
    const answers = this.answers();
    return answers?.assistantName.trim() && answers.userName.trim()
      ? `Meet ${answers.assistantName.trim()}`
      : 'Preview your kit';
  });
  readonly readyMessage = computed(() => {
    const answers = this.answers();
    return answers?.assistantName.trim() && answers.userName.trim()
      ? `${answers.assistantName.trim()} is ready for you, ${answers.userName.trim()}.`
      : 'Your kit is nearly ready.';
  });

  updateAnswers(answers: KitAnswers): void {
    this.answers.set(answers);
  }

  async download(): Promise<void> {
    const answers = this.answers();
    if (!answers || !this.valid() || this.downloading()) return;
    this.downloading.set(true);
    try {
      await this.zipGenerator.download(answers);
    } finally {
      this.downloading.set(false);
    }
  }
}
