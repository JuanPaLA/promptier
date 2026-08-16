import type { Block } from '../model/Block';
import type { PromptContent } from '../model/PromptContent';
import { codecFor } from './blocks/blockCodecRegistry';

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
function blocksToText(blocks: readonly Block[]): string {
  return blocks
    .map(blockToText)
    .filter((text) => text.trim().length > 0)
    .join('\n\n');
}

function blockToText(block: Block): string {
  return codecFor(block).serialize(block, blocksToText);
}
