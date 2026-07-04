import { Schema } from 'prosemirror-model';

const HEADING_TAGS = ['h1', 'h2', 'h3'] as const;

export const promptSchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      group: 'block',
      content: 'text*',
      toDOM: () => ['p', 0] as const,
      parseDOM: [{ tag: 'p' }],
    },
    heading: {
      group: 'block',
      content: 'text*',
      attrs: { level: { default: 1 } },
      defining: true,
      toDOM: (node) => [HEADING_TAGS[node.attrs.level - 1], 0] as const,
      parseDOM: HEADING_TAGS.map((tag, index) => ({ tag, attrs: { level: index + 1 } })),
    },
    text: { group: 'inline' },
  },
});
