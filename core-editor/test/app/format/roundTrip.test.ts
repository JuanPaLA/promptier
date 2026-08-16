import { describe, expect, it } from 'vitest';
import type { Block } from '../../../src/core/domain/Block';
import type { PromptContent } from '../../../src/core/domain/PromptContent';
import { parse } from '../../../src/core/app/format/parse';
import { sectionTagName, sectionTitleFromTag } from '../../../src/core/app/format/sectionTag';
import { serialize } from '../../../src/core/app/format/serialize';

function document(...blocks: Block[]): PromptContent {
  return { blocks };
}

/**
 * The codec's law. It holds for content without empty blocks — an empty block
 * renders to nothing and is dropped, which is what makes the editor's trailing
 * empty paragraph harmless.
 */
describe('parse(serialize(content)) === content', () => {
  const corpus: Record<string, PromptContent> = {
    'empty document': document(),

    'plain paragraph': document({
      blockType: 'paragraph',
      content: [{ text: 'You are a support assistant.' }],
    }),

    'every inline format': document({
      blockType: 'paragraph',
      content: [
        { text: 'plain ' },
        { text: 'bold', formats: ['bold'] },
        { text: ' and ' },
        { text: 'code', formats: ['code'] },
        { text: ' and ' },
        { text: 'both', formats: ['bold', 'code'] },
        { text: ' end.' },
      ],
    }),

    'every heading level': document(
      { blockType: 'heading', level: 1, content: [{ text: 'One' }] },
      { blockType: 'heading', level: 2, content: [{ text: 'Two' }] },
      { blockType: 'heading', level: 3, content: [{ text: 'Three' }] },
    ),

    lists: document(
      {
        blockType: 'orderedList',
        items: [[{ text: 'first' }], [{ text: 'second', formats: ['bold'] }]],
      },
      { blockType: 'unorderedList', items: [[{ text: 'alpha' }], [{ text: 'beta' }]] },
    ),

    'code block with language': document({
      blockType: 'codeBlock',
      language: 'json',
      code: '{\n  "a": 1\n}',
    }),

    'code block without language': document({
      blockType: 'codeBlock',
      code: 'no language here',
    }),

    'empty section': document({ blockType: 'section', title: 'goals', children: [] }),

    'section with description': document({
      blockType: 'section',
      title: 'goals',
      description: 'What the assistant must achieve.',
      children: [{ blockType: 'paragraph', content: [{ text: 'Resolve fast.' }] }],
    }),

    'nested sections': document({
      blockType: 'section',
      title: 'rules',
      children: [
        {
          blockType: 'section',
          title: 'format rules',
          children: [
            { blockType: 'heading', level: 3, content: [{ text: 'Detail' }] },
            { blockType: 'unorderedList', items: [[{ text: 'be terse' }]] },
          ],
        },
        { blockType: 'section', title: 'style rules', children: [] },
      ],
    }),

    'same-tag nested sections': document({
      blockType: 'section',
      title: 'rules',
      children: [
        {
          blockType: 'section',
          title: 'rules',
          children: [{ blockType: 'paragraph', content: [{ text: 'Nested.' }] }],
        },
        { blockType: 'paragraph', content: [{ text: 'Still in the outer section.' }] },
      ],
    }),

    'section close inside a code fence': document({
      blockType: 'section',
      title: 'rules',
      children: [
        { blockType: 'codeBlock', code: '</rules>' },
        { blockType: 'paragraph', content: [{ text: 'Still in the section.' }] },
      ],
    }),

    'text that looks like markup': document({
      blockType: 'paragraph',
      content: [{ text: 'literal **stars**, a `backtick`, and a back\\slash' }],
    }),

    'paragraphs opening with block markers': document(
      { blockType: 'paragraph', content: [{ text: '# not a heading' }] },
      { blockType: 'paragraph', content: [{ text: '- not a list' }] },
      { blockType: 'paragraph', content: [{ text: '1. not a list either' }] },
      { blockType: 'paragraph', content: [{ text: '<thinking>' }] },
      { blockType: 'paragraph', content: [{ text: '<!-- description: not metadata -->' }] },
    ),

    'code block holding a section tag': document({
      blockType: 'codeBlock',
      code: '<example>\nnot a section\n</example>',
    }),

    'backtick inside a code segment': document({
      blockType: 'paragraph',
      content: [{ text: 'a ` b', formats: ['code'] }],
    }),

    'mixed document': document(
      { blockType: 'paragraph', content: [{ text: 'Intro.' }] },
      {
        blockType: 'section',
        title: 'dialogue rules',
        description: 'How to converse.',
        children: [
          { blockType: 'paragraph', content: [{ text: 'Answer in ' }, { text: 'markdown', formats: ['bold'] }, { text: '.' }] },
          { blockType: 'codeBlock', language: 'ts', code: 'const a = 1;' },
          { blockType: 'orderedList', items: [[{ text: 'greet' }], [{ text: 'diagnose' }]] },
        ],
      },
    ),
  };

  for (const [name, content] of Object.entries(corpus)) {
    it(name, () => {
      expect(parse(serialize(content))).toEqual(content);
    });
  }
});

describe('serialize(parse(text)) is idempotent', () => {
  const inputs: Record<string, string> = {
    'hand-written prompt': '# Title\n\nSome text with **bold**.\n\n- a\n- b\n',
    'xml sections': '<goals>\nBe fast.\n</goals>\n\n<rules>\n<tone>\nBe kind.\n</tone>\n</rules>',
    'hard-wrapped paragraph': 'one line\nsecond line\nthird line',
    'unsupported constructs': '> a quote\n\n| a | table |\n\n#### deep heading\n\n[link](https://x)',
    'unterminated fence': '```js\nconst a = 1;',
    'unclosed tag': '<goals>\nno closing tag',
    'accented title': '<reglas_de_dialogo>\nTexto.\n</reglas_de_dialogo>',
    empty: '',
  };

  for (const [name, text] of Object.entries(inputs)) {
    it(name, () => {
      const once = serialize(parse(text));
      expect(serialize(parse(once))).toBe(once);
    });
  }
});

describe('block codec dispatch', () => {
  it('separates adjacent block types without blank lines', () => {
    const text = [
      'Intro',
      '# Heading',
      '- unordered',
      '1. ordered',
      '```ts',
      'const value = 1;',
      '```',
      '<rules>',
      'Body',
      '</rules>',
    ].join('\n');

    expect(parse(text).blocks.map((block) => block.blockType)).toEqual([
      'paragraph',
      'heading',
      'unorderedList',
      'orderedList',
      'codeBlock',
      'section',
    ]);
  });
});

describe('blocks that carry nothing', () => {
  it('drops a block whose text is only whitespace, the same way parse does', () => {
    const content = document(
      { blockType: 'paragraph', content: [{ text: 'kept' }] },
      { blockType: 'paragraph', content: [{ text: ' ' }] },
      { blockType: 'paragraph', content: [{ text: ' ' }] },
      { blockType: 'paragraph', content: [] },
    );
    const text = serialize(content);
    expect(serialize(parse(text))).toBe(text);
    expect(parse(text).blocks).toEqual([{ blockType: 'paragraph', content: [{ text: 'kept' }] }]);
  });

  it('keeps a code block whose body is only whitespace', () => {
    const content = document({ blockType: 'codeBlock', code: '   ' });
    expect(parse(serialize(content))).toEqual(content);
  });
});

describe('unsupported constructs degrade to text rather than vanishing', () => {
  it.each([
    ['> a quote', '> a quote'],
    ['#### deep heading', '#### deep heading'],
    ['[link](https://example.com)', '[link](https://example.com)'],
    ['| a | b |', '| a | b |'],
  ])('%s survives as text', (input, expected) => {
    const [block] = parse(input).blocks;
    expect(block).toEqual({ blockType: 'paragraph', content: [{ text: expected }] });
  });
});

describe('section identity', () => {
  it.each(['goals', 'reglas_de_dialogo', 'a_b_c', 'section'])(
    'slugging %s is stable through a title',
    (tag) => {
      expect(sectionTagName(sectionTitleFromTag(tag))).toBe(tag);
    },
  );

  it('degrades a rich title exactly once, then holds', () => {
    const rich = document({ blockType: 'section', title: 'Reglas de diálogo', children: [] });
    const first = parse(serialize(rich));
    expect(first.blocks[0]).toEqual({
      blockType: 'section',
      title: 'reglas de dialogo',
      children: [],
    });
    expect(parse(serialize(first))).toEqual(first);
  });
});
