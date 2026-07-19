import type { Format } from './Format';

export type BlockContent = TextSegment[];

export interface TextSegment {
  readonly text: string;
  readonly formats?: Format[];
}
