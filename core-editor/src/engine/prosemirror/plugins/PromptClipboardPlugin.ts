import { Slice, type ResolvedPos } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { parse } from '../../../prompt/serialization/parse';
import { SECTION_TITLE_NODE } from '../descriptors/blocks/sectionDescriptor';
import type { PromptDocumentMapper } from '../mapping/PromptDocumentMapper';

/**
 * Reads pasted plain text as prompt source, so `# Title` arrives as a heading
 * instead of a paragraph that happens to start with `# `. Plain text is how the
 * copy button and every non-HTML source hand a prompt over.
 */
export class PromptClipboardPlugin {
  readonly plugin: Plugin;

  constructor(private readonly documentMapper: PromptDocumentMapper) {
    this.plugin = new Plugin({
      props: {
        // ProseMirror treats a falsy result as "not handled", though its typings say `Slice`.
        clipboardTextParser: (text, $context) => this.sliceFromText(text, $context) as Slice,
      },
    });
  }

  /** `null` leaves the paste to ProseMirror's default, which keeps the text verbatim. */
  private sliceFromText(text: string, $context: ResolvedPos): Slice | null {
    if ($context.parent.type.name === SECTION_TITLE_NODE) return null;

    const content = parse(text);
    if (content.blocks.length === 0) return null;

    const fragment = this.documentMapper.toDocument(content).content;
    const isSingleParagraph = fragment.childCount === 1 && fragment.firstChild!.type.name === 'paragraph';
    // Open ends make a lone paragraph merge into the paragraph at the cursor.
    const openDepth = isSingleParagraph ? 1 : 0;
    return new Slice(fragment, openDepth, openDepth);
  }
}
