import { codeBlockPresentation } from './codeBlockPresentation';
import { headingPresentation } from './headingPresentation';
import { orderedListPresentation } from './orderedListPresentation';
import { paragraphPresentation } from './paragraphPresentation';
import type { BlockPresentationMap } from './BlockPresentation';
import { BlockPresentationRegistry } from './BlockPresentationRegistry';
import { quotePresentation } from './quotePresentation';
import { sectionPresentation } from './sectionPresentation';
import { unorderedListPresentation } from './unorderedListPresentation';

const blockPresentations = {
  paragraph: paragraphPresentation,
  heading: headingPresentation,
  codeBlock: codeBlockPresentation,
  orderedList: orderedListPresentation,
  unorderedList: unorderedListPresentation,
  quote: quotePresentation,
  section: sectionPresentation,
} satisfies BlockPresentationMap;

export const blockPresentationRegistry = new BlockPresentationRegistry(blockPresentations);
