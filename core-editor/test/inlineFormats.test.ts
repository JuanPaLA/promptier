import { describe, expect, it } from 'vitest';

import type { BlockContent } from '../src/prompt/model/BlockContent';
import { parseInline, serializeInline } from '../src/prompt/serialization/inlineCodec';

describe('inline format codecs', () => {
  it.each([
    ['bold', '**text**'],
    ['code', '`text`'],
    ['italic', '_text_'],
  ] as const)('serializes and parses %s through the shared algorithm', (format, prompt) => {
    const content: BlockContent = [{ text: 'text', formats: [format] }];

    expect(serializeInline(content)).toBe(prompt);
    expect(parseInline(prompt)).toEqual(content);
  });

  it('round-trips nested formats in canonical order', () => {
    const content: BlockContent = [
      { text: 'nested', formats: ['bold', 'italic', 'code'] },
    ];

    expect(serializeInline(content)).toBe('**_`nested`_**');
    expect(parseInline(serializeInline(content))).toEqual(content);
  });

  it('keeps nested delimiters literal inside literal formats', () => {
    const content: BlockContent = [
      { text: '_not italic_ and **not bold**', formats: ['code'] },
    ];

    expect(parseInline(serializeInline(content))).toEqual(content);
  });

  it('derives literal escaping from registered codecs', () => {
    const content: BlockContent = [{ text: String.raw`*bold* _italic_ \`code\`` }];

    expect(parseInline(serializeInline(content))).toEqual(content);
  });

  it('keeps adjacent formats separate', () => {
    const content: BlockContent = [
      { text: 'bold', formats: ['bold'] },
      { text: 'italic', formats: ['italic'] },
      { text: 'code', formats: ['code'] },
    ];

    expect(parseInline(serializeInline(content))).toEqual(content);
  });

  it.each(['<dialog_format_rules>', '</dialog_format_rules>'])('preserves literal tag spelling: %s', (tag) => {
    expect(parseInline(`See ${tag}.`)).toEqual([{ text: `See ${tag}.` }]);
    expect(serializeInline([{ text: `See ${tag}.` }])).toBe(`See ${tag}.`);
    expect(parseInline(`_See ${tag}._`)).toEqual([{ text: `See ${tag}.`, formats: ['italic'] }]);
    expect(serializeInline(parseInline(`<dialog\\_format\\_rules>`))).toBe('<dialog_format_rules>');
  });

  it('does not swallow formatting that happens to spell a tag across segments', () => {
    const content: BlockContent = [{ text: '<a' }, { text: 'b', formats: ['italic'] }, { text: '>' }];
    expect(parseInline(serializeInline(content))).toEqual(content);
    expect(serializeInline(parseInline(serializeInline(content)))).toBe(serializeInline(content));
  });
});

it('round-trips literal delimiters inside nested code formatting', () => {
  const content: BlockContent = [{ text: '<dialog_format_rules> **x** ` \\', formats: ['bold', 'italic', 'code'] }];
  expect(parseInline(serializeInline(content))).toEqual(content);
});
