import type { Block } from '../model/Block';
import type { SectionBlock } from '../model/blocks/SectionBlock';
import type { PromptContent } from '../model/PromptContent';
import { sectionTagName } from '../serialization';
import type { OutlineEntry } from './OutlineEntry';

export function buildOutline(content: PromptContent): OutlineEntry[] {
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
