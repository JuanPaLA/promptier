import { boldDescriptor } from './boldDescriptor';
import { codeDescriptor } from './codeDescriptor';
import { italicDescriptor } from './italicDescriptor';
import type { MarkDescriptorMap } from './MarkRegistry';

export const markDescriptors = {
  bold: boldDescriptor,
  italic: italicDescriptor,
  code: codeDescriptor,
} satisfies MarkDescriptorMap;
