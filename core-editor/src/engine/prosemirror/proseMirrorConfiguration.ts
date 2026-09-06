import { BlockRegistry } from './descriptors/blocks/BlockRegistry';
import { codeBlockDescriptor } from './descriptors/blocks/codeBlockDescriptor';
import { headingDescriptor } from './descriptors/blocks/headingDescriptor';
import { orderedListDescriptor } from './descriptors/blocks/orderedListDescriptor';
import { paragraphDescriptor } from './descriptors/blocks/paragraphDescriptor';
import { sectionDescriptor } from './descriptors/blocks/sectionDescriptor';
import { unorderedListDescriptor } from './descriptors/blocks/unorderedListDescriptor';
import { markDescriptors } from './descriptors/marks/markDescriptors';
import { MarkRegistry } from './descriptors/marks/MarkRegistry';
import { createPromptSchema } from './descriptors/promptSchema';
import { PromptDocumentMapper } from './mapping/PromptDocumentMapper';

export const blockRegistry = new BlockRegistry({
  paragraph: paragraphDescriptor,
  heading: headingDescriptor,
  codeBlock: codeBlockDescriptor,
  orderedList: orderedListDescriptor,
  unorderedList: unorderedListDescriptor,
  section: sectionDescriptor,
});

export const markRegistry = new MarkRegistry(markDescriptors);
export const promptSchema = createPromptSchema(blockRegistry, markRegistry);
export const documentMapper = new PromptDocumentMapper(promptSchema, blockRegistry);
