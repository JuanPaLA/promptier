import { inlineFormatRegistry } from '../../prompt/serialization/formats/inlineFormatCodecs';
import { BlockRegistry } from './descriptors/blocks/BlockRegistry';
import { blockDescriptors } from './descriptors/blocks/blockDescriptors';
import { markDescriptors } from './descriptors/marks/markDescriptors';
import { MarkRegistry } from './descriptors/marks/MarkRegistry';
import { createPromptSchema } from './descriptors/promptSchema';
import { PromptDocumentMapper } from './mapping/PromptDocumentMapper';

export const blockRegistry = new BlockRegistry(blockDescriptors);

export const markRegistry = new MarkRegistry(markDescriptors, inlineFormatRegistry);
export const promptSchema = createPromptSchema(blockRegistry, markRegistry);
export const documentMapper = new PromptDocumentMapper(promptSchema, blockRegistry);
