import type { BlockType } from '@cachai/promptier-core-editor';
import type {
  BlockPresentation,
  BlockPresentationMap,
} from './BlockPresentation';

export class BlockPresentationRegistry {
  private readonly presentationsByType = new Map<BlockType, BlockPresentation>();

  constructor(presentationsByType: BlockPresentationMap) {
    Object.entries(presentationsByType).forEach(([registeredType, presentation]) => {
      if (presentation.blockType !== registeredType) {
        throw new Error(
          `Block presentation registered as "${registeredType}" declares "${presentation.blockType}".`,
        );
      }
      this.presentationsByType.set(presentation.blockType, presentation);
    });
  }

  get(blockType: BlockType): BlockPresentation {
    const presentation = this.presentationsByType.get(blockType);
    if (!presentation) throw new Error(`No presentation is registered for block "${blockType}".`);
    return presentation;
  }
}
