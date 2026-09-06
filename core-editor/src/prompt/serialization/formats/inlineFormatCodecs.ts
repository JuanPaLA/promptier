import { boldCodec } from './boldCodec';
import { codeCodec } from './codeCodec';
import type { InlineFormatCodecMap } from './InlineFormatCodec';
import { InlineFormatRegistry } from './InlineFormatRegistry';
import { italicCodec } from './italicCodec';

const inlineFormatCodecs = {
  bold: boldCodec,
  italic: italicCodec,
  code: codeCodec,
} satisfies InlineFormatCodecMap;

export const inlineFormatRegistry = new InlineFormatRegistry(inlineFormatCodecs);
