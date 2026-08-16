import type { Block } from '../../domain/Block';
import type { SectionBlock } from '../../domain/blocks/SectionBlock';
import type { PromptContent } from '../../domain/PromptContent';
import { sectionTagName } from '../format';
import type { OutlineEntry } from './OutlineEntry';

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
