import type { Block } from '../Block';

export interface SectionBlock {
  readonly blockType: 'section';
  readonly title: string;
  readonly children: Block[];
}
