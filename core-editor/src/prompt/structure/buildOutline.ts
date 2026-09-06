import type { Block } from '../model/Block';
import type { HeadingBlock } from '../model/blocks/HeadingBlock';
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
    const path = [...parentPath, index];
    if (block.blockType === 'heading') {
      return [{
        kind: 'heading',
        title: headingTitle(block),
        level: block.level,
        depth: depth + block.level - 1,
        path,
      }];
    }
    if (block.blockType === 'section') {
      return [
        {
          kind: 'section',
          id: sectionTagName(block.title),
          title: block.title,
          depth: depth,
          path,
        },
        ...entriesIn(block.children, depth + 1, path),
      ];
    }
    return [];
  });
}

function headingTitle(heading: HeadingBlock): string {
  return heading.content.map((segment) => segment.text).join('');
}
