import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec } from 'prosemirror-model';
import type { Block } from '../../../../prompt/model/Block';
import type { SectionBlock } from '../../../../prompt/model/blocks/SectionBlock';
import { sectionTagName } from '../../../../prompt/serialization/sectionTag';
import { caretAfterNode, replaceRangeWithBlock } from '../../editing/blockTransactions';
import type { BlockDescriptor } from './BlockDescriptor';
import { SectionNodeView } from './SectionNodeView';

export const SECTION_TITLE_NODE = 'sectionTitle';

export const sectionDescriptor: BlockDescriptor<SectionBlock> = {
  blockType: 'section',
  nodeSpec: sectionNodeSpec(),
  createDefaultBlock: () => ({
    blockType: 'section', title: 'Untitled section', children: [{ blockType: 'paragraph', content: [] }],
  }),
  extraNodes: { [SECTION_TITLE_NODE]: titleNodeSpec() },
  editorStyles: `
.prompt-section {
  position: relative;
  margin: 0.75rem 0;
  padding: 0.25rem 0 0.25rem 1.5rem;
  border-left: 2px solid #d0d7de;
}
.prompt-section-toggle {
  position: absolute;
  top: 0.35rem;
  left: 0.3rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1;
  color: #57606a;
}
.prompt-section-title {
  min-height: 1.2em;
  margin-bottom: 0.25rem;
  font-weight: 600;
  font-size: 1.05em;
}
.prompt-section-collapsed > .prompt-section-content > :not(.prompt-section-title) {
  display: none;
}
`,

  toProseMirrorNode: (block, schema, mapChild) => {
    const title = schema.nodes[SECTION_TITLE_NODE].create(
      null,
      block.title.length > 0 ? [schema.text(block.title)] : [],
    );
    const children =
      block.children.length > 0
        ? block.children.map(mapChild)
        : [schema.nodes.paragraph.createAndFill()!];
    return schema.nodes.section.create(null, [title, ...children]);
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
    return {
      blockType: 'section',
      title,
      children,
    };
  },

  inputRules: (schema) => [
    new InputRule(/^\/section\s$/, (state, _match, start) => {
      const $start = state.doc.resolve(start);
      if ($start.parent.type !== schema.nodes.paragraph) return null;
      if ($start.parent.textContent !== '/section') return null;
      const section = schema.nodes.section.create(null, [
        schema.nodes[SECTION_TITLE_NODE].create(),
        schema.nodes.paragraph.create(),
      ]);
      return replaceRangeWithBlock(state.tr, $start.before(), $start.after(), section);
    }),
  ],

  keymaps: (schema) => ({
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      if ($from.parent.type !== schema.nodes[SECTION_TITLE_NODE]) return false;
      dispatch?.(caretAfterNode(state.tr, $from));
      return true;
    },
  }),

  nodeView: (node) => new SectionNodeView(node),
};

function sectionNodeSpec(): NodeSpec {
  return {
    group: 'block',
    content: `${SECTION_TITLE_NODE} block+`,
    defining: true,
    // The anchor is derived from the title node, not stored: a stored attr would
    // go stale the moment the title is edited.
    toDOM: (node) =>
      [
        'section',
        {
          class: 'prompt-section',
          'data-section-id': sectionTagName(node.firstChild?.textContent ?? ''),
        },
        0,
      ] as const,
    parseDOM: [{ tag: 'section.prompt-section' }],
  };
}

/**
 * The section's title line. Not in the `block` group, so it can only exist
 * where the section's content expression places it: first child of a section.
 * Plain text only — a section title is an identifier, not rich content.
 */
function titleNodeSpec(): NodeSpec {
  return {
    content: 'text*',
    marks: '',
    defining: true,
    selectable: false,
    toDOM: () => ['div', { class: 'prompt-section-title' }, 0] as const,
    parseDOM: [{ tag: 'div.prompt-section-title' }],
  };
}
