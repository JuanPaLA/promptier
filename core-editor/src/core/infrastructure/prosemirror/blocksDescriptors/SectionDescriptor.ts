import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { Block } from '../../../domain/Block';
import { newSectionId, SectionBlock } from '../../../domain/blocks/SectionBlock';
import { BlockDescriptor } from './BlockDescriptor';
import { SectionNodeView } from './SectionNodeView';

export const SECTION_TITLE_NODE = 'sectionTitle';

/**
 * The section's title line. Not in the `block` group, so it can only exist
 * where the section's content expression places it: first child of a section.
 * Plain text only — a section title is an identifier, not rich content.
 */
const titleNodeSpec: NodeSpec = {
  content: 'text*',
  marks: '',
  defining: true,
  selectable: false,
  toDOM: () => ['div', { class: 'prompt-section-title' }, 0] as const,
  parseDOM: [{ tag: 'div.prompt-section-title' }],
};

const nodeSpec: NodeSpec = {
  group: 'block',
  content: `${SECTION_TITLE_NODE} block+`,
  attrs: {
    id: { default: '' },
    description: { default: null },
  },
  defining: true,
  toDOM: (node) =>
    ['section', { class: 'prompt-section', 'data-section-id': node.attrs.id }, 0] as const,
  parseDOM: [
    {
      tag: 'section.prompt-section',
      getAttrs: (dom) => ({ id: (dom as HTMLElement).getAttribute('data-section-id') ?? '' }),
    },
  ],
};

export const sectionProseMirrorBlock: BlockDescriptor<SectionBlock> = {
  blockType: 'section',
  nodeSpec,
  extraNodes: { [SECTION_TITLE_NODE]: titleNodeSpec },

  toProseMirrorNode: (block, schema, mapChild) => {
    const title = schema.nodes[SECTION_TITLE_NODE].create(
      null,
      block.title.length > 0 ? [schema.text(block.title)] : [],
    );
    const children =
      block.children.length > 0
        ? block.children.map(mapChild)
        : [schema.nodes.paragraph.createAndFill()!];
    return schema.nodes.section.create(
      { id: block.id || newSectionId(), description: block.description ?? null },
      [title, ...children],
    );
  },

  fromProseMirrorNode: (node, mapChild) => {
    let title = '';
    const children: Block[] = [];
    node.forEach((child) => {
      if (child.type.name === SECTION_TITLE_NODE) {
        title = child.textContent;
      } else {
        children.push(mapChild(child));
      }
    });
    const description = node.attrs.description as string | null;
    return {
      blockType: 'section',
      id: node.attrs.id as string,
      title,
      ...(description !== null ? { description } : {}),
      children,
    };
  },

  inputRules: (schema) => [
    // Typing "/section " on an otherwise empty paragraph turns it into a fresh section.
    new InputRule(/^\/section\s$/, (state, _match, start) => {
      const $start = state.doc.resolve(start);
      if ($start.parent.type !== schema.nodes.paragraph) return null;
      if ($start.parent.textContent !== '/section') return null;
      const section = schema.nodes.section.create({ id: newSectionId() }, [
        schema.nodes[SECTION_TITLE_NODE].create(),
        schema.nodes.paragraph.create(),
      ]);
      const tr = state.tr.replaceRangeWith($start.before(), $start.after(), section);
      // +2: into the section, then into its title.
      return tr.setSelection(TextSelection.create(tr.doc, $start.before() + 2));
    }),
  ],

  keymaps: (schema) => ({
    // Enter on the title jumps into the section body instead of splitting.
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      if ($from.parent.type !== schema.nodes[SECTION_TITLE_NODE]) return false;
      if (dispatch) {
        const bodyStart = state.doc.resolve($from.after());
        dispatch(state.tr.setSelection(TextSelection.near(bodyStart, 1)).scrollIntoView());
      }
      return true;
    },
  }),

  nodeView: (node) => new SectionNodeView(node),
};
