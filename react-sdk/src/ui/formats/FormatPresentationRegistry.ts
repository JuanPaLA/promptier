import type { Format } from '@cachai/promptier-core-editor';
import type {
  FormatPresentation,
  FormatPresentationMap,
} from './FormatPresentation';

export class FormatPresentationRegistry {
  private readonly presentationsByFormat = new Map<Format, FormatPresentation>();

  constructor(presentationsByFormat: FormatPresentationMap) {
    Object.entries(presentationsByFormat).forEach(([registeredFormat, presentation]) => {
      if (presentation.format !== registeredFormat) {
        throw new Error(
          `Format presentation registered as "${registeredFormat}" declares "${presentation.format}".`,
        );
      }
      this.presentationsByFormat.set(presentation.format, presentation);
    });
  }

  get(format: Format): FormatPresentation {
    const presentation = this.presentationsByFormat.get(format);
    if (!presentation) throw new Error(`No presentation is registered for format "${format}".`);
    return presentation;
  }
}
