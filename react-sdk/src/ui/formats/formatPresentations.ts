import { boldPresentation } from './boldPresentation';
import { codePresentation } from './codePresentation';
import type { FormatPresentationMap } from './FormatPresentation';
import { FormatPresentationRegistry } from './FormatPresentationRegistry';
import { italicPresentation } from './italicPresentation';

const formatPresentations = {
  bold: boldPresentation,
  italic: italicPresentation,
  code: codePresentation,
} satisfies FormatPresentationMap;

export const formatPresentationRegistry = new FormatPresentationRegistry(
  formatPresentations,
);
