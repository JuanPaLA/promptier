export type BlockContent = TextSegment[];

export interface TextSegment {
  readonly text: string;
  readonly formats?: Format[];
}

export type Format = 'bold' | 'code';
