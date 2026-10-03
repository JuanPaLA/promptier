import type { Format } from '@cachai/promptier-core-editor';

export interface FormatPresentation<F extends Format = Format> {
  readonly format: F;
  readonly label: string;
  readonly glyph: string;
}

export type FormatPresentationMap = {
  readonly [F in Format]: FormatPresentation<F>;
};
