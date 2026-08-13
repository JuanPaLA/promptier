import type { Block } from '../../domain/Block';
import type { BlockContent, TextSegment } from '../../domain/BlockContent';
import type { SectionBlock } from '../../domain/blocks/SectionBlock';
import type { Format } from '../../domain/Format';
import type { PromptContent } from '../../domain/PromptContent';
import { sectionTagName } from './sectionTag';
import { escapeBlockStart, escapeInlineText } from './textEscaping';

/**
 * Renders a document as prompt text: XML tags carry structure, markdown carries
 * everything inside. This is the one serialization — what a host stores *is*
 * what a model reads. See docs/format.md for the grammar.
 *
 * Blank blocks render to nothing and are dropped, so the round-trip law holds
 * over content without them (the editor's trailing empty paragraph is the
 * common case).
 */
export function serialize(content: PromptContent): string {
  return blocksToText(content.blocks);
}

/**
 * `trim`, not `length` — the test for "carries nothing" has to be the same one
 * `parse` uses to skip blank lines, or a whitespace-only paragraph survives
 * serialization and is then dropped on the way back in. Cutting and re-pasting
 * a document is enough to produce one. Blocks with their own delimiters (a
 * fence, a section's tags) are never blank by this test, so a code block full
 * of spaces still survives.
 */
function blocksToText(blocks: Block[]): string {
  return blocks
    .map(blockToText)
    .filter((text) => text.trim().length > 0)
    .join('\n\n');
}

function blockToText(block: Block): string {
  switch (block.blockType) {
    case 'paragraph':
      return escapeBlockStart(inlineToText(block.content));
    case 'heading':
      return `${'#'.repeat(block.level)} ${inlineToText(block.content)}`;
    case 'codeBlock':
      return `\`\`\`${block.language ?? ''}\n${block.code}\n\`\`\``;
    case 'orderedList':
      return block.items.map((item, index) => `${index + 1}. ${inlineToText(item)}`).join('\n');
    case 'unorderedList':
      return block.items.map((item) => `- ${inlineToText(item)}`).join('\n');
    case 'section':
      return sectionToText(block);
    default: {
      return block;
    }
  }
}

function sectionToText(section: SectionBlock): string {
  const tag = sectionTagName(section.title);
  const parts: string[] = [];
  if (section.description !== undefined) {
    parts.push(`<!-- description: ${section.description} -->`);
  }
  const body = blocksToText(section.children);
  if (body.length > 0) parts.push(body);
  return `<${tag}>\n${parts.join('\n\n')}${parts.length > 0 ? '\n' : ''}</${tag}>`;
}

function inlineToText(content: BlockContent): string {
  return content.map(segmentToText).join('');
}

function segmentToText(segment: TextSegment): string {
  return FORMAT_ORDER.filter((format) => segment.formats?.includes(format)).reduce(
    (inner, format) => FORMAT_WRAP[format](inner),
    escapeInlineText(segment.text),
  );
}

/** Nesting order for a multi-format segment, innermost first: code inside bold. */
const FORMAT_ORDER: Format[] = ['code', 'bold'];

const FORMAT_WRAP: Record<Format, (inner: string) => string> = {
  bold: (inner) => `**${inner}**`,
  code: (inner) => `\`${inner}\``,
};
