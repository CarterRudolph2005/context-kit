import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { TemplateCompiler } from '../core/services/template-compiler';
import { DEFAULT_ANSWERS, KitAnswers } from './kit-answers';

describe('sample kits', () => {
  it('writes fixed research and app samples when requested', () => {
    if (process.env['WRITE_SAMPLES'] !== '1') {
      expect(true).toBe(true);
      return;
    }

    const compiler = new TemplateCompiler();
    const samplesRoot = resolve(process.cwd(), 'samples');
    const common: KitAnswers = {
      ...DEFAULT_ANSWERS,
      track: 'research',
      userName: 'Alex',
      assistantName: 'Mira',
      experience: 'some',
      tools: ['claude-code', 'cursor', 'other'],
      projectName: 'Sleep and Learning',
      goal: 'Understand how sleep affects learning and memory.',
      deadline: '2026-06-30',
      today: '2026-01-01',
    };
    const samples: Array<{ folder: string; answers: KitAnswers }> = [
      {
        folder: 'research-demo',
        answers: {
          ...common,
          track: 'research',
          researchPurpose: 'academic',
          answerStyle: 'expert',
          sourceTypes: ['papers', 'datasets', 'web-articles'],
          outputs: ['reports', 'slides', 'charts'],
          webAccess: 'ask',
          usesObsidian: 'yes',
        },
      },
      {
        folder: 'app-demo',
        answers: {
          ...common,
          track: 'app',
          projectName: 'Neighborhood Pantry',
          goal: 'Build a simple service that helps neighbors share spare groceries.',
          projectStatus: 'new',
          audience: 'Neighbors in one local community',
          platform: 'website',
          launchTarget: 'few',
          needsAccounts: 'yes',
          storesData: 'yes',
          personalData: 'yes',
          payments: 'no',
          externalServices: 'Email notifications and a hosted database',
          budget: 'low',
          techStack: 'Angular, TypeScript, and Supabase',
        },
      },
    ];

    rmSync(samplesRoot, { recursive: true, force: true });
    for (const sample of samples) {
      const root = resolve(samplesRoot, sample.folder);
      for (const file of compiler.compile(sample.answers)) {
        const outputPath = resolve(root, file.path);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, file.content, 'utf8');
      }
    }

    expect(samples.length).toBe(2);
  });
});
