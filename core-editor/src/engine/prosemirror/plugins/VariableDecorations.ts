import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { TemplateSyntax } from '../../../prompt/templates/TemplateSyntax';
import { VariableAnalysis } from '../../../prompt/variables/VariableAnalysis';
import { VariableCatalog } from '../../../prompt/variables/VariableCatalog';
import type { VariableSchema } from '../../../prompt/variables/VariableSchema';

export class VariableDecorations {
  private readonly key = new PluginKey<DecorationSet>('variables');
  private currentCatalog = new VariableCatalog();
  private validationEnabled = false;
  readonly plugin: Plugin<DecorationSet>;

  constructor() {
    this.plugin = new Plugin({
      key: this.key,
      state: {
        init: (_, state) => this.decorations(state.doc),
        apply: (transaction, previous) => transaction.docChanged || transaction.getMeta(this.key)
          ? this.decorations(transaction.doc) : previous,
      },
      props: { decorations: (state) => this.key.getState(state) },
    });
  }

  get catalog(): VariableCatalog { return this.currentCatalog; }

  setSchema(view: EditorView, schema: VariableSchema | undefined): void {
    this.currentCatalog = new VariableCatalog(schema);
    view.dispatch(view.state.tr.setMeta(this.key, true).setMeta('addToHistory', false));
  }

  setValidation(view: EditorView, enabled: boolean): void {
    this.validationEnabled = enabled;
    view.dispatch(view.state.tr.setMeta(this.key, true).setMeta('addToHistory', false));
  }

  private decorations(doc: ProseMirrorNode): DecorationSet {
    if (!this.validationEnabled) return DecorationSet.empty;
    const blocks: Array<{ text: string; position: number; offset: number }> = [];
    let documentText = '';
    doc.descendants((node, position) => {
      if (!node.isTextblock) return;
      if (node.type.name !== 'sectionTitle') {
        blocks.push({ text: node.textContent, position: position + 1, offset: documentText.length });
        documentText += node.textContent + '\n';
      }
      return false;
    });
    const tokens = new TemplateSyntax().tokens(documentText);
    const uncertainScope = tokens.some((token) => token.kind === 'statement');
    const mentions = new VariableAnalysis(this.catalog).mentions(documentText, uncertainScope);
    const decorations: Decoration[] = [];
    for (const mention of mentions) {
      const definition = mention.definition;
      const type = definition?.types.join(' | ') || 'type unspecified';
      const label = mention.status === 'recognized'
        ? `${mention.path}: ${type}${definition?.required ? ' (required)' : ' (optional)'}`
        : `${mention.status === 'unknown' ? 'Unknown' : 'Unverified'} variable: ${mention.path}`;
      const description = definition?.description ? `${label} — ${definition.description}` : label;
      for (const block of blocks) {
        const start = Math.max(mention.start, block.offset);
        const end = Math.min(mention.end, block.offset + block.text.length);
        if (start >= end) continue;
        decorations.push(Decoration.inline(block.position + start - block.offset, block.position + end - block.offset, {
          class: `promptier-variable promptier-variable-${mention.status}`,
          'data-variable': mention.path, title: description, 'aria-label': description, tabindex: '0',
        }));
      }
    }
    return DecorationSet.create(doc, decorations);
  }
}
