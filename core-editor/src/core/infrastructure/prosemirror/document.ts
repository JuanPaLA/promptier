import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Block } from '../../domain/Block';
import { SystemPromptContent } from '../../domain/SystemPromptContent';
import { blockFromProseMirrorNode, blockToProseMirrorNode } from './blocks/registry';
import { promptSchema } from './schema';

export function toProseMirrorDoc(content: SystemPromptContent): ProseMirrorNode {
  const blockNodes = content.blocks.map((block) => blockToProseMirrorNode(block, promptSchema));
  return promptSchema.nodes.doc.create(null, blockNodes);
}

export function fromProseMirrorDoc(doc: ProseMirrorNode): SystemPromptContent {
  const blocks: Block[] = [];
  doc.forEach((blockNode) => {
    blocks.push(blockFromProseMirrorNode(blockNode));
  });
  return { blocks };
}
