import { DEFAULT_ANSWERS, isComplete, normalizeAnswers, slugify } from './kit-answers';

describe('slugify', () => {
  it.each([
    ['', 'my-project'],
    ['My App!!', 'my-app'],
    ['🎉🚀', 'my-project'],
  ])('turns %j into %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('limits long names to 40 characters without a trailing hyphen', () => {
    const result = slugify(`${'a'.repeat(39)}-${'b'.repeat(60)}`);
    expect(result).toHaveLength(39);
    expect(result.endsWith('-')).toBe(false);
  });
});

describe('normalizeAnswers', () => {
  it('trims text and collapses newlines in single-line fields', () => {
    const result = normalizeAnswers({
      ...DEFAULT_ANSWERS,
      userName: '  Casey\nJones  ',
      projectName: '  My\r\nProject  ',
      goal: '  First line\nsecond line  ',
      today: ' 2026-01-01 ',
    });

    expect(result.userName).toBe('Casey Jones');
    expect(result.projectName).toBe('My Project');
    expect(result.goal).toBe('First line\nsecond line');
    expect(result.today).toBe('2026-01-01');
  });

  it('applies every normalized text fallback', () => {
    const result = normalizeAnswers(DEFAULT_ANSWERS);

    expect(result.deadline).toBe('none set');
    expect(result.audience).toBe('_(to be filled in during setup)_');
    expect(result.externalServices).toBe('None planned yet');
    expect(result.techStack).toBe('Not decided yet');
    expect(result.projectSlug).toBe('my-project');
    expect(result.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not mutate answer arrays', () => {
    const normalized = normalizeAnswers(DEFAULT_ANSWERS);
    normalized.tools.push('cursor');
    expect(DEFAULT_ANSWERS.tools).toEqual(['claude-code']);
  });
});

describe('isComplete', () => {
  const completeAnswers = {
    ...DEFAULT_ANSWERS,
    track: 'research' as const,
    userName: 'Casey',
    projectName: 'Sleep research',
    goal: 'Understand sleep quality.',
  };

  it('accepts valid required answers', () => {
    expect(isComplete(completeAnswers)).toBe(true);
  });

  it('rejects missing and invalid required answers', () => {
    expect(isComplete(DEFAULT_ANSWERS)).toBe(false);
    expect(isComplete({ ...completeAnswers, tools: [] })).toBe(false);
    expect(isComplete({ ...completeAnswers, assistantName: 'Kit 🤖' })).toBe(false);
    expect(isComplete({ ...completeAnswers, goal: 'x'.repeat(401) })).toBe(false);
  });
});
