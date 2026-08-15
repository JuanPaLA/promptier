import type { Block } from '../../domain/Block';
import type { SectionBlock } from '../../domain/blocks/SectionBlock';
import type { PromptContent } from '../../domain/PromptContent';
import { sectionTagName } from '../format/sectionTag';
import type { OutlineEntry } from './OutlineEntry';

/**
 * The prompt's structure, flattened for navigation — a pure fold over the
 * document, like `serialize`. It stays out of the editor: an outline is a
 * *reading* of a document, so anything holding a `PromptContent` can derive one
 * without a live editor, including a server.
 *
 * Sections only, for now. Headings are structure a reader sees but the model
 * doesn't nest, so folding them in means deciding how a heading's level relates
 * to a section's depth — see todo.md.
 */
export function outline(content: PromptContent): OutlineEntry[] {
  return entriesIn(content.blocks, 0);
}

function entriesIn(blocks: Block[], depth: number): OutlineEntry[] {
  return blocks
    .filter((block): block is SectionBlock => block.blockType === 'section')
    .flatMap((section) => [
      { id: sectionTagName(section.title), title: section.title, depth },
      ...entriesIn(section.children, depth + 1),
    ]);
}
