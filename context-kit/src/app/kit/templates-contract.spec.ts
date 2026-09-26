import { PLACEHOLDER_KEYS } from './placeholders';
import { TEMPLATES } from './templates.generated';

describe('template contracts', () => {
  it('uses only known placeholders', () => {
    const knownKeys = new Set<string>(PLACEHOLDER_KEYS);

    for (const [templateId, template] of Object.entries(TEMPLATES)) {
      for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(
          knownKeys.has(match[1]),
          `${templateId} uses unknown placeholder {{${match[1]}}}`,
        ).toBe(true);
      }
    }
  });

  it('does not contain auto-loaded instruction file names', () => {
    for (const templateId of Object.keys(TEMPLATES)) {
      expect(templateId).not.toMatch(/(?:^|\/)(?:AGENTS|CLAUDE)\.md$/);
    }
  });
});
