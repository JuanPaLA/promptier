import { Schema } from 'prosemirror-model';

export const promptSchema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: {
      content: 'text*',
      toDOM: () => ['p', 0] as const,
      parseDOM: [{ tag: 'p' }],
    },
    text: { group: 'inline' },
  },
});
