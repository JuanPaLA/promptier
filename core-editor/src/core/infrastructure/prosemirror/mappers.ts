import { Node as ProseMirrorNode } from 'prosemirror-model';
import { SystemPromptContent } from '../../domain/SystemPromptContent';
import { promptSchema } from './schema';

export function toProseMirrorDoc(content: SystemPromptContent): ProseMirrorNode {
  const paragraphs = content.blocks.map((block) =>
    promptSchema.nodes.paragraph.create(
      null,
      block.text ? promptSchema.text(block.text) : undefined,
    ),
  );
  return promptSchema.nodes.doc.create(null, paragraphs);
}

export function fromProseMirrorDoc(doc: ProseMirrorNode): SystemPromptContent {
  const blocks: SystemPromptContent['blocks'] = [];
  doc.forEach((paragraphNode) => {
    blocks.push({ type: 'paragraph', text: paragraphNode.textContent });
  });
  return { blocks };
}
