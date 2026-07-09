import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Block } from '../../domain/Block';
import { PROMPT_CONTENT_VERSION, PromptContent } from '../../domain/PromptContent';
import { blockFromProseMirrorNode, blockToProseMirrorNode } from './blocksDescriptors/blockDescriptorRegistry';
import { promptSchema } from './Schema';

export function toProseMirrorDoc(content: PromptContent): ProseMirrorNode {
  if (content.blocks.length === 0) {
    return promptSchema.nodes.doc.createAndFill()!;
  }
  const blockNodes = content.blocks.map((b) => blockToProseMirrorNode(b, promptSchema));
  return promptSchema.nodes.doc.create(null, blockNodes);
}

export function fromProseMirrorDoc(doc: ProseMirrorNode): PromptContent {
  const blocks: Block[] = [];
  doc.forEach((blockNode) => {
    blocks.push(blockFromProseMirrorNode(blockNode));
  });
  return { version: PROMPT_CONTENT_VERSION, blocks };
}
