import type { Block } from '../../domain/Block';
import type { PromptContent } from '../../domain/PromptContent';
import { sectionTagName } from '../../domain/blocks/SectionBlock';
import { blockContentToMarkdown } from './toMarkdown';

/**
 * Renders a document as XML-wrapped sections: each section becomes a
 * `<tag>…</tag>` whose name is derived from its title, with a markdown body
 * inside. This is a sibling rendering strategy to `toMarkdown`, equal in
 * status — it reads the same semantic `PromptContent` and changes only the
 * exported string, never the stored document.
 *
 * The hybrid is deliberate: XML carries structure (sections), markdown carries
 * everything inside (paragraphs, loose headings, inline formatting). Nesting is
 * structural, so — unlike markdown headings — there is no depth/level to track.
 */
export function toXml(content: PromptContent): string {
  return blocksToXml(content.blocks);
}

function blocksToXml(blocks: Block[]): string {
  return blocks
    .map(blockToXml)
    .filter((xml) => xml.length > 0)
    .join('\n\n');
}

function blockToXml(block: Block): string {
  switch (block.blockType) {
    case 'paragraph':
      return blockContentToMarkdown(block.content);
    case 'heading':
      return `${'#'.repeat(block.level)} ${blockContentToMarkdown(block.content)}`;
    case 'section': {
      const tag = sectionTagName(block.title);
      const body = blocksToXml(block.children);
      return body.length > 0 ? `<${tag}>\n${body}\n</${tag}>` : `<${tag}></${tag}>`;
    }
    default: {
      return block;
    }
  }
}
