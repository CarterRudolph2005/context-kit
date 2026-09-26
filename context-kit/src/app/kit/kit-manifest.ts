import { KitAnswers } from './kit-answers';

export interface KitManifestEntry {
  outputPath: string;
  templateId: string;
  include: (answers: KitAnswers) => boolean;
  args?: string;
}

const always = (): boolean => true;
const research = (answers: KitAnswers): boolean => answers.track === 'research';
const app = (answers: KitAnswers): boolean => answers.track === 'app';
const claude = (answers: KitAnswers): boolean => answers.tools.includes('claude-code');

const files: KitManifestEntry[] = [
  { outputPath: 'AGENTS.md', templateId: 'common/AGENTS.template.md', include: always },
  { outputPath: 'CLAUDE.md', templateId: 'common/CLAUDE.template.md', include: claude },
  { outputPath: 'START-HERE.md', templateId: 'common/START-HERE.md', include: always },
  { outputPath: 'context/state.md', templateId: 'common/context/state.md', include: always },
  {
    outputPath: 'context/decisions.md',
    templateId: 'common/context/decisions.md',
    include: always,
  },
  { outputPath: 'context/log.md', templateId: 'common/context/log.md', include: always },
  { outputPath: 'raw/README.md', templateId: 'research/raw/README.md', include: research },
  { outputPath: 'wiki/index.md', templateId: 'research/wiki/index.md', include: research },
  { outputPath: 'outputs/README.md', templateId: 'research/outputs/README.md', include: research },
  {
    outputPath: 'context/knowledge/product.md',
    templateId: 'app/context/knowledge/product.md',
    include: app,
  },
  {
    outputPath: 'context/knowledge/roadmap.md',
    templateId: 'app/context/knowledge/roadmap.md',
    include: app,
  },
  {
    outputPath: 'context/knowledge/techStack.md',
    templateId: 'app/context/knowledge/techStack.md',
    include: app,
  },
  {
    outputPath: 'context/knowledge/conventions.md',
    templateId: 'app/context/knowledge/conventions.md',
    include: app,
  },
];

const commands = [
  { name: 'save', templateId: 'common/commands/save.md', include: always },
  { name: 'setup', templateId: 'common/commands/setup.md', include: always },
  { name: 'ingest', templateId: 'research/commands/ingest.md', include: research },
  { name: 'ask', templateId: 'research/commands/ask.md', include: research },
  { name: 'lint', templateId: 'research/commands/lint.md', include: research },
  { name: 'plan', templateId: 'app/commands/plan.md', include: app },
  { name: 'check', templateId: 'app/commands/check.md', include: app },
];

for (const command of commands) {
  files.push(
    {
      outputPath: `.claude/commands/${command.name}.md`,
      templateId: command.templateId,
      include: (answers) => claude(answers) && command.include(answers),
      args: '$ARGUMENTS',
    },
    {
      outputPath: `.cursor/commands/${command.name}.md`,
      templateId: command.templateId,
      include: (answers) => answers.tools.includes('cursor') && command.include(answers),
      args: 'the text the user typed after the command',
    },
  );
}

export const KIT_MANIFEST: readonly KitManifestEntry[] = files;
