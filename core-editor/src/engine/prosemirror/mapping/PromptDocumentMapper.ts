import type { Node as ProseMirrorNode, Schema } from 'prosemirror-model';

import type { Block, BlockType } from '../../../prompt/model/Block';
import type { PromptContent } from '../../../prompt/model/PromptContent';
import type { BlockRegistry } from '../descriptors/blocks/BlockRegistry';

/** Maps one prompt domain to and from the schema built for its descriptor registry. */
export class PromptDocumentMapper {
  constructor(
    private readonly schema: Schema,
    private readonly blocks: BlockRegistry,
  ) {}

  toDocument(content: PromptContent): ProseMirrorNode {
    if (content.blocks.length === 0) return this.schema.nodes.doc.createAndFill()!;
    return this.schema.nodes.doc.create(
      null,
      content.blocks.map((block) => this.toBlockNode(block)),
    );
  }

  fromDocument(document: ProseMirrorNode): PromptContent {
    const blocks: Block[] = [];
    document.forEach((blockNode) => blocks.push(this.fromBlockNode(blockNode)));
    return { blocks };
  }

  private toBlockNode(block: Block): ProseMirrorNode {
    return this.blocks
      .get(block.blockType)
      .toProseMirrorNode(block, this.schema, (child) => this.toBlockNode(child));
  }

  private fromBlockNode(node: ProseMirrorNode): Block {
    return this.blocks
      .get(node.type.name as BlockType)
      .fromProseMirrorNode(node, (child) => this.fromBlockNode(child));
  }
}
