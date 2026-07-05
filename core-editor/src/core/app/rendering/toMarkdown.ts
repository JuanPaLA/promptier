import { AnyBlock } from '../../domain/blocks/blockRegistry'
import { BlockContent, Format, TextSegment } from '../../domain/BlockContent'
import { PromptContent } from '../../domain/PromptContent'

export function toMarkdown(content: PromptContent): string {
  return content.blocks.map((block) => blockToMarkdown(block as AnyBlock)).join('\n\n');
}

function blockToMarkdown(block: AnyBlock): string {
  switch (block.blockType) {
    case 'paragraph':
      return blockContentToMarkdown(block.content);
    case 'heading':
      return `${'#'.repeat(block.level)} ${blockContentToMarkdown(block.content)}`;
    default: {
      return block;
    }
  }
}

function blockContentToMarkdown(content: BlockContent): string {
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
