import type { Block } from '../../domain/Block';
import type { BlockContent, TextSegment } from '../../domain/BlockContent';
import type { Format } from '../../domain/Format';
import type { PromptContent } from '../../domain/PromptContent';

export function toMarkdown(content: PromptContent): string {
  return blocksToMarkdown(content.blocks, 1);
}

function blocksToMarkdown(blocks: Block[], depth: number): string {
  return blocks
    .map((block) => blockToMarkdown(block, depth))
    .filter((markdown) => markdown.length > 0)
    .join('\n\n');
}

function blockToMarkdown(block: Block, depth: number): string {
  switch (block.blockType) {
    case 'paragraph':
      return blockContentToMarkdown(block.content);
    case 'heading':
      return `${'#'.repeat(block.level)} ${blockContentToMarkdown(block.content)}`;
    case 'orderedList':
      return block.items
        .map((item, index) => `${index + 1}. ${blockContentToMarkdown(item)}`)
        .join('\n');
    case 'section': {
      // The section's title is its heading; the level comes from nesting depth,
      // so restructuring sections renumbers headings for free. The description
      // is authoring metadata and is intentionally not rendered.
      const heading = `${'#'.repeat(Math.min(depth, 6))} ${block.title}`.trimEnd();
      const body = blocksToMarkdown(block.children, depth + 1);
      return body.length > 0 ? `${heading}\n\n${body}` : heading;
    }
    default: {
      return block;
    }
  }
}

export function blockContentToMarkdown(content: BlockContent): string {
  return content.map(segmentToMarkdown).join('');
}

function segmentToMarkdown(segment: TextSegment): string {
  return FORMAT_ORDER.filter((format) => segment.formats?.includes(format)).reduce(
    (inner, format) => FORMAT_WRAP[format](inner),
    segment.text,
  );
}

/** Nesting order for a multi-format segment, innermost first: code inside bold → **`text`**. */
const FORMAT_ORDER: Format[] = ['code', 'bold'];

const FORMAT_WRAP: Record<Format, (inner: string) => string> = {
  bold: (inner) => `**${inner}**`,
  code: (inner) => `\`${inner}\``,
};
