import { codeBlockDescriptor } from './codeBlockDescriptor';
import { headingDescriptor } from './headingDescriptor';
import { orderedListDescriptor } from './orderedListDescriptor';
import { paragraphDescriptor } from './paragraphDescriptor';
import { quoteDescriptor } from './quoteDescriptor';
import type { BlockDescriptorMap } from './BlockRegistry';
import { sectionDescriptor } from './sectionDescriptor';
import { unorderedListDescriptor } from './unorderedListDescriptor';

export const blockDescriptors = {
  paragraph: paragraphDescriptor,
  heading: headingDescriptor,
  codeBlock: codeBlockDescriptor,
  orderedList: orderedListDescriptor,
  unorderedList: unorderedListDescriptor,
  quote: quoteDescriptor,
  section: sectionDescriptor,
} satisfies BlockDescriptorMap;
