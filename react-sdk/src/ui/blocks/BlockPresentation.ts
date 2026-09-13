import type { BlockType } from 'core-editor';

export interface BlockPresentation<B extends BlockType = BlockType> {
  readonly blockType: B;
  readonly label: string;
  readonly glyph: string;
}

export type BlockPresentationMap = {
  readonly [B in BlockType]: BlockPresentation<B>;
};
