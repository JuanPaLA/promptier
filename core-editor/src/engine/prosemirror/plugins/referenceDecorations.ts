import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import type { ReferenceResolver } from '../../../prompt/references/ReferenceResolver';
import { sectionTagMentions } from '../../../prompt/serialization/sectionTagSyntax';
import { NavigateCommands } from '../commands/NavigateCommands';

export function referenceDecorations(resolveDocument: (doc: ProseMirrorNode) => readonly ReferenceResolver[]): Plugin {
  function decorations(doc: ProseMirrorNode): DecorationSet {
    const resolvers = resolveDocument(doc);
    const result: Decoration[] = [];
    doc.descendants((node, position) => {
      if (!node.isTextblock || node.type.spec.code || node.type.name === 'sectionTitle') return;
      let text = '';
      let start = 0;
      let code = false;
      function flush() {
        const mentions = code ? [{ text, offset: 0 }] : [...sectionTagMentions(text)].map((match) => ({ text: match[0], offset: match.index! }));
        for (const mention of mentions) {
          const reference = resolvers.map((resolver) => resolver.resolve(mention.text)).find(Boolean);
          if (!reference || (!code && reference.status === 'missing')) continue;
          const label = reference.status === 'resolved' ? `Go to ${reference.text}`
            : `${reference.status === 'missing' ? 'Missing' : 'Ambiguous'} ${reference.kind} reference: ${reference.text}`;
          result.push(Decoration.inline(start + mention.offset, start + mention.offset + mention.text.length, {
            class: `promptier-reference promptier-reference-${reference.status}`,
            'data-reference': mention.text, title: label, 'aria-label': label,
            ...(reference.target ? { role: 'link', tabindex: '0' } : {}),
          }));
        }
        text = '';
      }
      node.forEach((child, offset) => {
        if (child.isText) {
          const childCode = child.marks.some((mark) => mark.type.name === 'code');
          if (childCode !== code) flush();
          code = childCode;
          if (!text) start = position + 1 + offset;
          text += child.text;
        } else flush();
      });
      flush();
      return false;
    });
    return DecorationSet.create(doc, result);
  }

  function activate(view: EditorView, event: Event): boolean {
    const element = (event.target as HTMLElement | null)?.closest?.('[data-reference]');
    const text = element?.getAttribute('data-reference');
    if (!text) return false;
    const reference = resolveDocument(view.state.doc).map((resolver) => resolver.resolve(text)).find(Boolean);
    if (!reference?.target) return false;
    event.preventDefault();
    return new NavigateCommands().run(view, { type: 'navigate', target: reference.target });
  }

  return new Plugin<DecorationSet>({
    state: {
      init: (_, state) => decorations(state.doc),
      apply: (transaction, previous) => transaction.docChanged ? decorations(transaction.doc) : previous,
    },
    props: {
      decorations(state) { return this.getState(state); },
      handleDOMEvents: {
        click: activate,
        keydown(view, event) { return event.key === 'Enter' && activate(view, event); },
      },
    },
  });
}

export const referenceStyles = `
.ProseMirror .promptier-reference {
  background: #eef2ff; color: #4338ca; border-radius: 4px;
  padding: 1px 3px; border-bottom: 1px solid #a5b4fc;
}
.ProseMirror .promptier-reference-resolved { cursor: pointer; }
.ProseMirror .promptier-reference-resolved::before { content: '↗ '; }
.ProseMirror .promptier-reference:focus { outline: 2px solid #6366f1; }
.ProseMirror .promptier-reference-missing,
.ProseMirror .promptier-reference-ambiguous {
  background: #fffbeb; color: #92400e; border-bottom: 1px dashed #d97706;
}
`;
