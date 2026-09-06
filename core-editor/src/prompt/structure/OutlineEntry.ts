import type { HeadingBlock } from '../model/blocks/HeadingBlock';

interface OutlineEntryBase {
  readonly kind: 'section' | 'heading';
  readonly title: string;
  readonly depth: number;
  readonly path: readonly number[];
}

export interface SectionOutlineEntry extends OutlineEntryBase {
  readonly kind: 'section';
  readonly id: string;
}

export interface HeadingOutlineEntry extends OutlineEntryBase {
  readonly kind: 'heading';
  readonly level: HeadingBlock['level'];
}

export type OutlineEntry = SectionOutlineEntry | HeadingOutlineEntry;
