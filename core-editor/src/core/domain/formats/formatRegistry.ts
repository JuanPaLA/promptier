import { Format, FormatDefinition } from '../BlockContent';

export const formatDefinitions: Record<Format, FormatDefinition> = {
  bold: { format: 'bold', wrap: (inner) => `**${inner}**` },
  code: { format: 'code', wrap: (inner) => `\`${inner}\`` },
};

/**
 * Nesting order when a segment carries several formats, innermost first.
 * code sits inside bold, so a bold+code segment renders as **`text`**.
 */
export const FORMAT_ORDER: Format[] = ['code', 'bold'];
