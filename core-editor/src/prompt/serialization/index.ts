/**
 * The codec, as its own entry point: pure, DOM-free, no ProseMirror. Import it
 * in Node to render a stored prompt at LLM-call time without pulling the editor
 * in. Keeping this barrel free of browser imports is what makes that true —
 * `format.build.test.ts` checks it against the built bundle.
 */
export { serialize } from './serialize';
export { parse } from './parse';
export { sectionTagName, sectionTitleFromTag } from './sectionTag';

export type { PromptContent } from '../model/PromptContent';
export type { Block, BlockType } from '../model/Block';
export type { ParagraphBlock } from '../model/blocks/ParagraphBlock';
export type { HeadingBlock } from '../model/blocks/HeadingBlock';
export type { CodeBlock } from '../model/blocks/CodeBlock';
export type { OrderedListBlock } from '../model/blocks/OrderedListBlock';
export type { UnorderedListBlock } from '../model/blocks/UnorderedListBlock';
export type { QuoteBlock } from '../model/blocks/QuoteBlock';
export type { SectionBlock } from '../model/blocks/SectionBlock';
export type { BlockContent, TextSegment } from '../model/BlockContent';
export type { Format } from '../model/Format';
