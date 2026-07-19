import type { Mark, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import type { BlockContent, TextSegment } from '../../domain/BlockContent';
import type { Format } from '../../domain/Format';

/**
 * Domain BlockContent ⇄ ProseMirror inline nodes. This is the inline analog of
 * DocumentMapper: block descriptors delegate their text mapping here so the
 * marks ⇄ formats translation lives in one place instead of per block.
 */

export function blockContentToNodes(content: BlockContent, schema: Schema): ProseMirrorNode[] {
  return content
    .filter((segment) => segment.text.length > 0)
    .map((segment) => schema.text(segment.text, formatsToMarks(segment.formats, schema)));
}

export function blockContentFromNode(node: ProseMirrorNode): BlockContent {
  const segments: TextSegment[] = [];
  node.forEach((child) => {
    if (!child.isText) return;
    const text = child.text ?? '';
    const formats = child.marks.map((mark) => mark.type.name as Format);
    segments.push(formats.length > 0 ? { text, formats } : { text });
  });
  return segments;
}

function formatsToMarks(formats: Format[] | undefined, schema: Schema): Mark[] {
  return (formats ?? []).map((format) => schema.marks[format].create());
}
