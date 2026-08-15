/**
 * The codec, as its own entry point: pure, DOM-free, no ProseMirror. Import it
 * in Node to render a stored prompt at LLM-call time without pulling the editor
 * in. Keeping this barrel free of browser imports is what makes that true —
 * `format.build.test.ts` checks it against the built bundle.
 */
export { serialize } from './serialize';
export { parse } from './parse';
export { sectionTagName, sectionTitleFromTag } from './sectionTag';

export type { PromptContent } from '../../domain/PromptContent';
export type { Block, BlockType } from '../../domain/Block';
export type { ParagraphBlock } from '../../domain/blocks/ParagraphBlock';
export type { HeadingBlock } from '../../domain/blocks/HeadingBlock';
export type { CodeBlock } from '../../domain/blocks/CodeBlock';
export type { OrderedListBlock } from '../../domain/blocks/OrderedListBlock';
export type { UnorderedListBlock } from '../../domain/blocks/UnorderedListBlock';
export type { SectionBlock } from '../../domain/blocks/SectionBlock';
export type { BlockContent, TextSegment } from '../../domain/BlockContent';
export type { Format } from '../../domain/Format';
