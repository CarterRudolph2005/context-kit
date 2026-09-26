import { Injectable } from '@angular/core';
import {
  KitAnswers,
  NormalizedKitAnswers,
  normalizeAnswers,
  RequirementAnswer,
} from '../../kit/kit-answers';
import { KitFile } from '../../kit/kit-file';
import { KIT_MANIFEST } from '../../kit/kit-manifest';
import { PLACEHOLDER_KEYS, PlaceholderKey } from '../../kit/placeholders';
import { renderTemplate } from '../../kit/render-template';
import { TEMPLATES } from '../../kit/templates.generated';

@Injectable({ providedIn: 'root' })
export class TemplateCompiler {
  compile(answers: KitAnswers, templates: Record<string, string> = TEMPLATES): KitFile[] {
    const normalized = normalizeAnswers(answers);
    const values = this.buildValues(normalized);
    const track = normalized.track === 'research' ? 'research' : 'app';

    values.trackRules = renderTemplate(
      this.template(templates, `${track}/AGENTS.track.md`),
      values,
    ).trimEnd();
    values.trackStartHere = renderTemplate(
      this.template(templates, `${track}/START-HERE.track.md`),
      values,
    ).trimEnd();

    return KIT_MANIFEST.filter((entry) => entry.include(normalized))
      .map((entry) => ({
        path: entry.outputPath,
        content: renderTemplate(this.template(templates, entry.templateId), {
          ...values,
          args: entry.args ?? '',
        }),
      }))
      .sort((left, right) => left.path.localeCompare(right.path));
  }

  private template(templates: Record<string, string>, id: string): string {
    if (!Object.prototype.hasOwnProperty.call(templates, id)) {
      throw new Error(`Missing template: ${id}`);
    }
    return templates[id];
  }

  private buildValues(answers: NormalizedKitAnswers): Record<PlaceholderKey, string> {
    const labels = LABELS;
    const yesNo = (answer: RequirementAnswer): string =>
      answer === 'yes' ? 'Yes' : answer === 'no' ? 'No' : 'Not sure';
    const requirements = [
      ['Sign-in', answers.needsAccounts],
      ['Saves data', answers.storesData],
      ['Personal or sensitive data', answers.personalData],
      ['Payments', answers.payments],
    ] as const;
    const uncertain = requirements.filter(([, value]) => value === 'unsure');
    const commandRows =
      answers.track === 'research'
        ? [
            ['save', 'save'],
            ['set up', 'setup'],
            ['ingest', 'ingest'],
            ['ask …', 'ask'],
            ['health check', 'lint'],
          ]
        : [
            ['save', 'save'],
            ['set up', 'setup'],
            ['plan …', 'plan'],
            ['check', 'check'],
            ['undo that', ''],
          ];
    const hasCommands = answers.tools.includes('claude-code') || answers.tools.includes('cursor');

    const values: Record<PlaceholderKey, string> = {
      projectName: answers.projectName,
      projectSlug: answers.projectSlug,
      goal: answers.goal,
      userName: answers.userName,
      assistantName: answers.assistantName,
      audience: answers.audience,
      techStack: answers.techStack,
      externalServices: answers.externalServices,
      deadline: answers.deadline,
      today: answers.today,
      trackName: answers.track === 'research' ? 'Research' : 'App development',
      experienceLabel: labels.experience[answers.experience],
      experienceTone: '',
      platform: labels.platform[answers.platform],
      projectStatus: labels.projectStatus[answers.projectStatus],
      launchTarget: labels.launchTarget[answers.launchTarget],
      researchPurpose: labels.researchPurpose[answers.researchPurpose],
      answerStyle: labels.answerStyle[answers.answerStyle],
      webAccessLabel: labels.webAccess[answers.webAccess],
      budget: labels.budget[answers.budget],
      webAccessRule: '',
      requirementsList:
        answers.track === 'app'
          ? requirements
              .map(
                ([name, value]) =>
                  `- ${name}: ${yesNo(value)}${value === 'unsure' ? ' — ask before building (A10)' : ''}`,
              )
              .join('\n')
          : '',
      openQuestions:
        answers.track === 'app' && uncertain.length
          ? uncertain
              .map(
                ([name]) =>
                  `- ${name}: not sure yet — decide before building anything that needs it.`,
              )
              .join('\n')
          : '- (none yet)',
      initialTasks: this.initialTasks(answers),
      memoryMap: this.memoryMap(answers.track),
      welcomeTrackLines: this.welcomeLines(answers.track),
      trackRules: '',
      trackStartHere: '',
      toolsStartHere: this.toolsStartHere(answers),
      commandList: commandRows
        .map(([phrase, command]) =>
          hasCommands && command ? `- Say "${phrase}" (or type /${command})` : `- Say "${phrase}"`,
        )
        .join('\n'),
      sourceTypesList: answers.sourceTypes.length
        ? answers.sourceTypes.map((value) => labels.sourceTypes[value]).join(', ')
        : 'any kind of source',
      outputsList: answers.outputs.length
        ? answers.outputs.map((value) => labels.outputs[value]).join(', ')
        : 'written reports',
      obsidianSection:
        answers.usesObsidian === 'yes'
          ? 'Open this folder as an Obsidian vault:\n1. Install Obsidian from obsidian.md.\n2. Open Obsidian and choose **Open folder as vault**.\n3. Pick this project folder.'
          : '',
      args: '',
    };

    values.experienceTone = {
      new: `${answers.userName} is new to this. Explain what you are doing and why in plain language, define technical terms the first time you use them, and give exact numbered steps whenever ${answers.userName} must do something.`,
      some: `${answers.userName} has some experience. Explain decisions briefly and skip basics unless asked.`,
      experienced: `${answers.userName} is experienced. Be concise and skip explanations of standard concepts.`,
    }[answers.experience];
    values.webAccessRule = {
      yes: `You may look things up online to fill gaps. Mark each such fact \`(web: <URL>, retrieved YYYY-MM-DD)\` and never present it as coming from \`raw/\`.`,
      ask: `Ask ${answers.userName} before searching online. If they agree, mark each such fact \`(web: <URL>, retrieved YYYY-MM-DD)\`.`,
      no: `Do not search online. Work only from \`raw/\`, and say what is missing so ${answers.userName} can add sources.`,
    }[answers.webAccess];

    for (const key of PLACEHOLDER_KEYS) {
      if (values[key] === undefined) throw new Error(`Missing compiler value: ${key}`);
    }
    return values;
  }

  private initialTasks(answers: NormalizedKitAnswers): string {
    if (answers.track === 'research') {
      return [
        'Finish first-session setup',
        'Add the first sources to raw/',
        'Ingest sources into the wiki',
        'Ask the first research question',
      ]
        .map((task) => `- [ ] ${task}`)
        .join('\n');
    }
    const second =
      answers.techStack === 'Not decided yet'
        ? 'Choose a tech stack together'
        : 'Confirm the tech stack';
    const third =
      answers.projectStatus === 'new'
        ? 'Set up the project skeleton and undo history (git)'
        : 'Map the existing code into context/knowledge/conventions.md';
    return ['Finish first-session setup', second, third, 'Plan the first feature']
      .map((task) => `- [ ] ${task}`)
      .join('\n');
  }

  private memoryMap(track: KitAnswers['track']): string {
    const files =
      track === 'research'
        ? [
            ['context/decisions.md', 'decisions and why they were made'],
            ['context/log.md', 'completed work in date order'],
            ['wiki/index.md', 'sources, concepts and research questions'],
            ['raw/', 'original source files'],
            ['outputs/', 'reports, slides and charts'],
          ]
        : [
            ['context/decisions.md', 'decisions and why they were made'],
            ['context/log.md', 'completed work in date order'],
            ['context/knowledge/product.md', 'product purpose, audience and requirements'],
            ['context/knowledge/roadmap.md', 'first version and future features'],
            ['context/knowledge/techStack.md', 'chosen technologies and versions'],
            ['context/knowledge/conventions.md', 'project structure and working commands'],
          ];
    return files.map(([path, purpose]) => `- \`${path}\` — ${purpose}`).join('\n');
  }

  private welcomeLines(track: KitAnswers['track']): string {
    return track === 'research'
      ? [
          '  - Drop sources (PDFs, clipped articles, datasets, images) into `raw/`, then say "ingest". I\'ll turn them into a linked wiki.',
          "  - Ask me anything, and I'll answer from your sources with citations.",
          '  - Say "health check" now and then, and I\'ll tidy the wiki and suggest new questions.',
        ].join('\n')
      : [
          '  - Say "plan <idea>" and I\'ll describe the feature in plain words before building it.',
          '  - After I build something, I\'ll give you simple steps to check it yourself. Say "check" any time.',
          '  - I\'ll ask before anything risky or costly, and I keep an undo history, so you can say "undo that".',
        ].join('\n');
  }

  private toolsStartHere(answers: NormalizedKitAnswers): string {
    const sections: string[] = [];
    if (answers.tools.includes('claude-code')) {
      sections.push(`### Claude Code

For first-time setup, install Claude Code from claude.com/claude-code. Open the Terminal app, type \`cd \` (with a space), drag this folder into the window, and press Enter. Type \`claude\`, press Enter, and say "hi".

${answers.assistantName} will welcome you and ask a few questions to finish setup.`);
    }
    if (answers.tools.includes('cursor')) {
      sections.push(`### Cursor

For first-time setup, install Cursor from cursor.com. Choose File → Open Folder, pick this folder, open the chat, and say "hi".

${answers.assistantName} will welcome you and ask a few questions to finish setup.`);
    }
    if (answers.tools.includes('other')) {
      sections.push(`### Another AI tool

Open this folder in your AI tool and say "read AGENTS.md".

${answers.assistantName} will welcome you and ask a few questions to finish setup.`);
    }
    return sections.join('\n\n');
  }
}

const LABELS = {
  experience: { new: 'New to this', some: 'Some experience', experienced: 'Very experienced' },
  platform: { website: 'Website', phone: 'Phone app', desktop: 'Desktop app', unsure: 'Not sure' },
  projectStatus: { new: 'New project', existing: 'Existing code' },
  launchTarget: {
    me: 'Just me',
    few: 'A few people I share it with',
    public: 'Anyone (public)',
    unsure: 'Not sure',
  },
  researchPurpose: {
    learning: 'Personal learning',
    school: 'School or coursework',
    work: 'A work project',
    academic: 'Academic paper or thesis',
    other: 'Other',
  },
  answerStyle: {
    quick: 'Quick, plain-language summaries',
    detailed: 'Detailed explanations with examples and citations',
    expert: 'Expert-level depth with full citations and caveats',
  },
  webAccess: { yes: 'Yes', ask: 'Ask me first', no: 'Only use my sources' },
  budget: {
    free: 'Free only',
    low: 'Up to about $20/month',
    flexible: 'Flexible',
    unsure: 'Not decided — ask before any cost',
  },
  sourceTypes: {
    papers: 'papers/PDFs',
    'web-articles': 'web articles',
    'books-notes': 'books & notes',
    datasets: 'datasets',
    'code-repositories': 'code repositories',
    images: 'images',
    'videos-transcripts': 'videos/transcripts',
  },
  outputs: { reports: 'written reports', slides: 'slide decks', charts: 'charts' },
} as const;
