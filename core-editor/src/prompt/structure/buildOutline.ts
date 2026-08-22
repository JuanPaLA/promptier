import type { Block } from '../model/Block';
import type { SectionBlock } from '../model/blocks/SectionBlock';
import type { PromptContent } from '../model/PromptContent';
import { sectionTagName } from '../serialization';
import type { OutlineEntry } from './OutlineEntry';

export function buildOutline(content: PromptContent): OutlineEntry[] {
  return entriesIn(content.blocks, 0, []);
}

function entriesIn(
  blocks: Block[],
  depth: number,
  parentPath: readonly number[],
): OutlineEntry[] {
  return blocks.flatMap((block, index) => {
    if (!isSection(block)) return [];
    const path = [...parentPath, index];
    return [
      { id: sectionTagName(block.title), title: block.title, depth, path },
      ...entriesIn(block.children, depth + 1, path),
    ];
  });
}

function isSection(block: Block): block is SectionBlock {
  return block.blockType === 'section';
}
