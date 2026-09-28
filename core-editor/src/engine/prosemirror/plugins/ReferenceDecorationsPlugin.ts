import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import type { ReferenceResolver, ResolvedReference } from '../../../prompt/references/ReferenceResolver';
import { sectionReferences } from '../../../prompt/references/sectionReferences';
import { toolReferences } from '../../../prompt/references/toolReferences';
import { sectionTagMentions } from '../../../prompt/serialization/sectionTagSyntax';
import { TemplateSyntax } from '../../../prompt/templates/TemplateSyntax';
import { ToolCatalog } from '../../../prompt/tools/ToolCatalog';
import type { ToolDefinition } from '../../../prompt/tools/ToolDefinition';
import { NavigateCommands } from '../commands/NavigateCommands';
import type { PromptDocumentMapper } from '../mapping/PromptDocumentMapper';

export class ReferenceDecorationsPlugin {
  private readonly key = new PluginKey<DecorationSet>('references');
  private currentTools = new ToolCatalog();
  readonly plugin: Plugin<DecorationSet>;

  constructor(private readonly mapper: PromptDocumentMapper) {
    this.plugin = new Plugin({
      key: this.key,
      state: {
        init: (_, state) => this.decorations(state.doc),
        apply: (transaction, previous) => transaction.docChanged || transaction.getMeta(this.key)
          ? this.decorations(transaction.doc) : previous,
      },
      props: {
        decorations: (state) => this.key.getState(state),
        handleDOMEvents: {
          click: (view, event) => this.activate(view, event),
          keydown: (view, event) => event.key === 'Enter' && this.activate(view, event),
        },
      },
    });
  }

  get tools(): ToolCatalog { return this.currentTools; }

  setTools(view: EditorView, tools: readonly ToolDefinition[]): void {
    this.currentTools = new ToolCatalog(tools);
    view.dispatch(view.state.tr.setMeta(this.key, true).setMeta('addToHistory', false));
  }

  private resolvers(doc: ProseMirrorNode): readonly ReferenceResolver[] {
    return [sectionReferences(this.mapper.fromDocument(doc)), toolReferences(this.currentTools)];
  }

  private decorations(doc: ProseMirrorNode): DecorationSet {
    const resolvers = this.resolvers(doc);
    const result: Decoration[] = [];
    doc.descendants((node, position) => {
      if (!node.isTextblock || node.type.spec.code || node.type.name === 'sectionTitle') return;
      let text = '';
      let start = 0;
      let code = false;
      function flush() {
        const templateTokens = new TemplateSyntax().tokens(text);
        const mentions = code ? [{ text, offset: 0 }] : [...sectionTagMentions(text)].map((match) => ({ text: match[0], offset: match.index! }));
        for (const mention of mentions) {
          if (templateTokens.some((token) => token.start <= mention.offset && token.end > mention.offset)) continue;
          const reference = resolvers.map((resolver) => resolver.resolve(mention.text)).find(Boolean);
          if (!reference || (!code && reference.status === 'missing')) continue;
          const title = label(reference);
          result.push(Decoration.inline(start + mention.offset, start + mention.offset + mention.text.length, {
            class: `promptier-reference promptier-reference-${reference.kind} promptier-reference-${reference.status}`,
            'data-reference': mention.text, title, 'aria-label': title,
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

  private activate(view: EditorView, event: Event): boolean {
    const element = (event.target as HTMLElement | null)?.closest?.('[data-reference]');
    const text = element?.getAttribute('data-reference');
    if (!text) return false;
    const reference = this.resolvers(view.state.doc).map((resolver) => resolver.resolve(text)).find(Boolean);
    if (!reference?.target) return false;
    event.preventDefault();
    return new NavigateCommands().run(view, { type: 'navigate', target: reference.target });
  }
}

function label(reference: ResolvedReference): string {
  if (reference.status !== 'resolved') {
    return `${reference.status === 'missing' ? 'Missing' : 'Ambiguous'} ${reference.kind} reference: ${reference.text}`;
  }
  return reference.target ? `Go to ${reference.text}` : reference.detail ?? reference.text;
}

export const referenceStyles = `
.ProseMirror .promptier-reference {
  background: #eef2ff; color: #4338ca; border-radius: 4px;
  padding: 1px 3px; border-bottom: 1px solid #a5b4fc;
}
.ProseMirror .promptier-reference[role="link"] { cursor: pointer; }
.ProseMirror .promptier-reference[role="link"]::before { content: '↗ '; }
.ProseMirror .promptier-reference:focus { outline: 2px solid #6366f1; }
.ProseMirror .promptier-reference-tool { background: #fef2f2; color: #b91c1c; border-bottom-color: #fca5a5; }
.ProseMirror .promptier-reference-parameter { background: #fff7f7; color: #dc2626; border-bottom: 1px dotted #fca5a5; }
.ProseMirror .promptier-reference-missing,
.ProseMirror .promptier-reference-ambiguous {
  background: #fffbeb; color: #92400e; border-bottom: 1px dashed #d97706;
}
`;
