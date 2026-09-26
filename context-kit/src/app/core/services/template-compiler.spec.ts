import { TestBed } from '@angular/core/testing';
import { AiTool, DEFAULT_ANSWERS, KitAnswers, Track } from '../../kit/kit-answers';
import { KIT_MANIFEST } from '../../kit/kit-manifest';
import { PLACEHOLDER_KEYS } from '../../kit/placeholders';
import { TEMPLATES } from '../../kit/templates.generated';
import { TemplateCompiler } from './template-compiler';

const toolSets: AiTool[][] = [
  ['claude-code'],
  ['cursor'],
  ['other'],
  ['claude-code', 'cursor', 'other'],
];

const baseAnswers = (track: Track, tools: AiTool[]): KitAnswers => ({
  ...DEFAULT_ANSWERS,
  track,
  tools,
  userName: 'Casey',
  projectName: 'Sleep Lab',
  goal: 'Understand sleep quality.',
  today: '2026-01-01',
});

const filledAnswers = (track: Track, tools: AiTool[]): KitAnswers => ({
  ...baseAnswers(track, tools),
  assistantName: 'Nova',
  experience: 'experienced',
  deadline: '2026-12-01',
  researchPurpose: 'academic',
  answerStyle: 'expert',
  sourceTypes: ['papers', 'datasets'],
  outputs: ['reports', 'charts'],
  webAccess: 'yes',
  usesObsidian: 'no',
  projectStatus: 'existing',
  audience: 'Sleep researchers',
  platform: 'website',
  launchTarget: 'public',
  needsAccounts: 'yes',
  storesData: 'yes',
  personalData: 'no',
  payments: 'no',
  externalServices: 'OpenAlex',
  budget: 'low',
  techStack: 'Angular and TypeScript',
});

function fixtureTemplates(): Record<string, string> {
  const templates: Record<string, string> = {};
  const allValues = PLACEHOLDER_KEYS.map((key) => `${key}={{${key}}}`).join('\n');
  for (const entry of KIT_MANIFEST) templates[entry.templateId] = allValues;
  templates['research/AGENTS.track.md'] = 'research track for {{userName}}';
  templates['research/START-HERE.track.md'] = 'research start for {{assistantName}}';
  templates['app/AGENTS.track.md'] = 'app track for {{userName}}';
  templates['app/START-HERE.track.md'] = 'app start for {{assistantName}}';
  return templates;
}

function expectedPaths(track: Track, tools: AiTool[]): string[] {
  const paths = [
    'AGENTS.md',
    'START-HERE.md',
    'context/decisions.md',
    'context/log.md',
    'context/state.md',
  ];
  if (tools.includes('claude-code')) paths.push('CLAUDE.md');
  if (track === 'research') {
    paths.push('outputs/README.md', 'raw/README.md', 'wiki/index.md');
  } else {
    paths.push(
      'context/knowledge/conventions.md',
      'context/knowledge/product.md',
      'context/knowledge/roadmap.md',
      'context/knowledge/techStack.md',
    );
  }
  const commands =
    track === 'research'
      ? ['ask', 'ingest', 'lint', 'save', 'setup']
      : ['check', 'plan', 'save', 'setup'];
  if (tools.includes('claude-code')) {
    paths.push(...commands.map((command) => `.claude/commands/${command}.md`));
  }
  if (tools.includes('cursor')) {
    paths.push(...commands.map((command) => `.cursor/commands/${command}.md`));
  }
  return paths.sort((left, right) => left.localeCompare(right));
}

describe('TemplateCompiler fixture templates', () => {
  let service: TemplateCompiler;
  let templates: Record<string, string>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateCompiler);
    templates = fixtureTemplates();
  });

  it.each(
    (['research', 'app'] as Track[]).flatMap((track) =>
      toolSets.map((tools) => ({ track, tools, label: `${track}: ${tools.join(',')}` })),
    ),
  )('returns the correct sorted paths for $label', ({ track, tools }) => {
    const files = service.compile(baseAnswers(track, tools), templates);
    expect(files.map((file) => file.path)).toEqual(expectedPaths(track, tools));
  });

  it('includes CLAUDE.md only for Claude Code', () => {
    expect(
      service
        .compile(baseAnswers('research', ['claude-code']), templates)
        .some((file) => file.path === 'CLAUDE.md'),
    ).toBe(true);
    expect(
      service
        .compile(baseAnswers('research', ['cursor']), templates)
        .some((file) => file.path === 'CLAUDE.md'),
    ).toBe(false);
  });

  it('uses the right command argument text for each tool', () => {
    const files = service.compile(baseAnswers('research', ['claude-code', 'cursor']), templates);
    const claude = files.filter((file) => file.path.startsWith('.claude/'));
    const cursor = files.filter((file) => file.path.startsWith('.cursor/'));
    expect(claude.every((file) => file.content.includes('args=$ARGUMENTS'))).toBe(true);
    expect(
      cursor.every((file) =>
        file.content.includes('args=the text the user typed after the command'),
      ),
    ).toBe(true);
    expect(
      files
        .filter((file) => !file.path.startsWith('.claude/'))
        .every((file) => !file.content.includes('$ARGUMENTS')),
    ).toBe(true);
  });

  it('keeps track-specific commands in their own kits', () => {
    const researchPaths = service
      .compile(baseAnswers('research', ['claude-code']), templates)
      .map((file) => file.path);
    const appPaths = service
      .compile(baseAnswers('app', ['claude-code']), templates)
      .map((file) => file.path);
    expect(researchPaths).toEqual(
      expect.arrayContaining([
        '.claude/commands/ingest.md',
        '.claude/commands/ask.md',
        '.claude/commands/lint.md',
      ]),
    );
    expect(researchPaths).not.toEqual(
      expect.arrayContaining(['.claude/commands/plan.md', '.claude/commands/check.md']),
    );
    expect(appPaths).toEqual(
      expect.arrayContaining(['.claude/commands/plan.md', '.claude/commands/check.md']),
    );
    expect(appPaths).not.toEqual(
      expect.arrayContaining([
        '.claude/commands/ingest.md',
        '.claude/commands/ask.md',
        '.claude/commands/lint.md',
      ]),
    );
  });

  it('maps requirements and uncertain requirements to open questions', () => {
    const content = service.compile(
      {
        ...baseAnswers('app', ['other']),
        needsAccounts: 'yes',
        storesData: 'no',
        personalData: 'unsure',
        payments: 'unsure',
      },
      templates,
    )[0].content;
    expect(content).toContain('- Sign-in: Yes');
    expect(content).toContain('- Saves data: No');
    expect(content).toContain('- Personal or sensitive data: Not sure — ask before building (A10)');
    expect(content).toContain(
      '- Personal or sensitive data: not sure yet — decide before building anything that needs it.',
    );
    expect(content).toContain(
      '- Payments: not sure yet — decide before building anything that needs it.',
    );

    const research = service.compile(baseAnswers('research', ['other']), templates)[0].content;
    expect(research).toContain('requirementsList=\n');
    expect(research).toContain('openQuestions=- (none yet)');
  });

  it.each([
    ['yes', 'You may look things up online', '(web: <URL>, retrieved YYYY-MM-DD)'],
    ['ask', 'Ask Casey before searching online', '(web: <URL>, retrieved YYYY-MM-DD)'],
    ['no', 'Do not search online', 'Casey can add sources'],
  ] as const)('maps %s web access and substitutes the user name', (webAccess, start, end) => {
    const content = service.compile(
      { ...baseAnswers('research', ['other']), webAccess },
      templates,
    )[0].content;
    expect(content).toContain(start);
    expect(content).toContain(end);
  });

  it.each([
    ['new', 'Casey is new to this.'],
    ['some', 'Casey has some experience.'],
    ['experienced', 'Casey is experienced.'],
  ] as const)('maps %s experience and substitutes the user name', (experience, expected) => {
    const content = service.compile({ ...baseAnswers('app', ['other']), experience }, templates)[0]
      .content;
    expect(content).toContain(expected);
  });
});

describe('TemplateCompiler real templates', () => {
  let service: TemplateCompiler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateCompiler);
  });

  it.skipIf(Object.keys(TEMPLATES).length === 0).each(
    (['research', 'app'] as Track[]).flatMap((track) =>
      toolSets.flatMap((tools) => [
        { label: `${track} default ${tools.join(',')}`, answers: baseAnswers(track, tools) },
        { label: `${track} filled ${tools.join(',')}`, answers: filledAnswers(track, tools) },
      ]),
    ),
  )('renders a valid kit for $label', ({ answers }) => {
    const files = service.compile(answers);
    expect(files.every((file) => !file.content.includes('{{'))).toBe(true);

    const agents = files.find((file) => file.path === 'AGENTS.md')!;
    const state = files.find((file) => file.path === 'context/state.md')!;
    const startHere = files.find((file) => file.path === 'START-HERE.md')!;
    const lineCount = (content: string): number => content.split(/\r?\n/).length;
    expect(lineCount(agents.content)).toBeLessThanOrEqual(300);
    expect(lineCount(state.content)).toBeLessThanOrEqual(80);
    expect(lineCount(startHere.content)).toBeLessThanOrEqual(120);
    expect(state.content).toContain('Setup: INCOMPLETE');
    expect(state.content).toContain(answers.goal.trim());
    expect(state.content).toContain(answers.userName.trim());
    expect(state.content).toContain(answers.assistantName.trim());
    expect(agents.content).toContain(`# ${answers.assistantName.trim()} — Operating Manual`);
  });
});
