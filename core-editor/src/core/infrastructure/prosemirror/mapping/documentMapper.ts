import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import type { Block } from '../../../domain/Block';
import { PROMPT_CONTENT_VERSION, type PromptContent } from '../../../domain/PromptContent';
import {
  blockFromProseMirrorNode,
  blockToProseMirrorNode,
} from '../descriptors/blocks/blockDescriptorRegistry';

/**
 * Domain PromptContent ⇄ ProseMirror doc. Pure in both directions: the same
 * content always maps to an equal doc, which is what lets `setContent` skip a
 * no-op update by comparing docs.
 */
export function toProseMirrorDoc(content: PromptContent, schema: Schema): ProseMirrorNode {
  if (content.blocks.length === 0) {
    return schema.nodes.doc.createAndFill()!;
  }
  const blockNodes = content.blocks.map((block) => blockToProseMirrorNode(block, schema));
  return schema.nodes.doc.create(null, blockNodes);
}

export function fromProseMirrorDoc(doc: ProseMirrorNode): PromptContent {
  const blocks: Block[] = [];
  doc.forEach((blockNode) => {
    blocks.push(blockFromProseMirrorNode(blockNode));
  });
  return { version: PROMPT_CONTENT_VERSION, blocks };
}
