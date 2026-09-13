import type { BlockCodecMap } from './BlockCodec';
import { BlockCodecCatalog } from './BlockCodecCatalog';
import { codeBlockCodec } from './codeBlockCodec';
import { headingCodec } from './headingCodec';
import { orderedListCodec } from './orderedListCodec';
import { paragraphCodec } from './paragraphCodec';
import { quoteCodec } from './quoteCodec';
import { sectionCodec } from './sectionCodec';
import { unorderedListCodec } from './unorderedListCodec';

const blockCodecs = {
  paragraph: paragraphCodec,
  heading: headingCodec,
  codeBlock: codeBlockCodec,
  orderedList: orderedListCodec,
  unorderedList: unorderedListCodec,
  quote: quoteCodec,
  section: sectionCodec,
} satisfies BlockCodecMap;

export const blockCodecRegistry = new BlockCodecCatalog(blockCodecs);
