import type { Mark, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import type { BlockContent, TextSegment } from '../../../prompt/model/BlockContent';
import type { Format } from '../../../prompt/model/Format';

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
