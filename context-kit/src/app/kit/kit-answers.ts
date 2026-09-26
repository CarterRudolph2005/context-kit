export type Track = 'research' | 'app' | '';
export type Experience = 'new' | 'some' | 'experienced';
export type AiTool = 'claude-code' | 'cursor' | 'other';
export type ResearchPurpose = 'learning' | 'school' | 'work' | 'academic' | 'other';
export type AnswerStyle = 'quick' | 'detailed' | 'expert';
export type SourceType =
  | 'papers'
  | 'web-articles'
  | 'books-notes'
  | 'datasets'
  | 'code-repositories'
  | 'images'
  | 'videos-transcripts';
export type OutputType = 'reports' | 'slides' | 'charts';
export type WebAccess = 'yes' | 'ask' | 'no';
export type YesNo = 'yes' | 'no';
export type ProjectStatus = 'new' | 'existing';
export type Platform = 'website' | 'phone' | 'desktop' | 'unsure';
export type LaunchTarget = 'me' | 'few' | 'public' | 'unsure';
export type RequirementAnswer = 'yes' | 'no' | 'unsure';
export type Budget = 'free' | 'low' | 'flexible' | 'unsure';

export interface KitAnswers {
  track: Track;
  userName: string;
  assistantName: string;
  experience: Experience;
  tools: AiTool[];
  projectName: string;
  goal: string;
  deadline: string;
  researchPurpose: ResearchPurpose;
  answerStyle: AnswerStyle;
  sourceTypes: SourceType[];
  outputs: OutputType[];
  webAccess: WebAccess;
  usesObsidian: YesNo;
  projectStatus: ProjectStatus;
  audience: string;
  platform: Platform;
  launchTarget: LaunchTarget;
  needsAccounts: RequirementAnswer;
  storesData: RequirementAnswer;
  personalData: RequirementAnswer;
  payments: RequirementAnswer;
  externalServices: string;
  budget: Budget;
  techStack: string;
  /** Optional override used to make generated fixtures deterministic. */
  today?: string;
}

export interface NormalizedKitAnswers extends KitAnswers {
  projectSlug: string;
  today: string;
}

export const DEFAULT_ANSWERS: KitAnswers = {
  track: '',
  userName: '',
  assistantName: 'Kit',
  experience: 'new',
  tools: ['claude-code'],
  projectName: '',
  goal: '',
  deadline: '',
  researchPurpose: 'learning',
  answerStyle: 'detailed',
  sourceTypes: [],
  outputs: ['reports'],
  webAccess: 'ask',
  usesObsidian: 'yes',
  projectStatus: 'new',
  audience: '',
  platform: 'unsure',
  launchTarget: 'unsure',
  needsAccounts: 'unsure',
  storesData: 'unsure',
  personalData: 'unsure',
  payments: 'unsure',
  externalServices: '',
  budget: 'free',
  techStack: '',
};

const collapseLineBreaks = (value: string): string => value.trim().replace(/[\r\n]+/g, ' ');

const localDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug || 'my-project';
}

export function normalizeAnswers(answers: KitAnswers): NormalizedKitAnswers {
  const projectName = collapseLineBreaks(answers.projectName);

  return {
    ...answers,
    userName: collapseLineBreaks(answers.userName),
    assistantName: collapseLineBreaks(answers.assistantName),
    projectName,
    goal: answers.goal.trim(),
    deadline: collapseLineBreaks(answers.deadline) || 'none set',
    audience: collapseLineBreaks(answers.audience) || '_(to be filled in during setup)_',
    externalServices: collapseLineBreaks(answers.externalServices) || 'None planned yet',
    techStack: collapseLineBreaks(answers.techStack) || 'Not decided yet',
    today: collapseLineBreaks(answers.today ?? '') || localDate(),
    projectSlug: slugify(projectName),
    tools: [...answers.tools],
    sourceTypes: [...answers.sourceTypes],
    outputs: [...answers.outputs],
  };
}

export function isComplete(answers: KitAnswers): boolean {
  const normalized = normalizeAnswers(answers);
  return (
    (normalized.track === 'research' || normalized.track === 'app') &&
    normalized.userName.length >= 1 &&
    normalized.userName.length <= 40 &&
    normalized.assistantName.length >= 1 &&
    normalized.assistantName.length <= 30 &&
    /^[A-Za-z0-9 '\-]+$/.test(normalized.assistantName) &&
    normalized.tools.length >= 1 &&
    normalized.projectName.length >= 1 &&
    normalized.projectName.length <= 60 &&
    normalized.goal.length >= 1 &&
    normalized.goal.length <= 400
  );
}
