import { renderTemplate } from './render-template';

describe('renderTemplate', () => {
  it('replaces template values', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'Casey' })).toBe('Hello Casey!');
  });

  it('throws when a value is missing', () => {
    expect(() => renderTemplate('{{missing}}', {})).toThrowError('Missing template value: missing');
  });

  it('keeps replacement syntax and placeholders inside values literal', () => {
    expect(renderTemplate('{{value}} {{other}}', { value: '$& $1 {{other}}', other: 'done' })).toBe(
      '$& $1 {{other}} done',
    );
  });

  it('leaves wikilinks untouched', () => {
    expect(renderTemplate('Read [[source-page]] and {{name}}.', { name: 'notes' })).toBe(
      'Read [[source-page]] and notes.',
    );
  });
});
