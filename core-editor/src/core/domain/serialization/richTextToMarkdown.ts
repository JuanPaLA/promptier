import { BlockContent, TextSegment } from '../BlockContent';
import { FORMAT_ORDER, formatDefinitions } from '../formats/formatRegistry';

export function richTextToMarkdown(content: BlockContent): string {
  return content.map(segmentToMarkdown).join('');
}

function segmentToMarkdown(segment: TextSegment): string {
  const formats = FORMAT_ORDER.filter((format) => segment.formats?.includes(format));
  return formats.reduce((inner, format) => formatDefinitions[format].wrap(inner), segment.text);
}
