/**
 * Derives an XML tag name from a section title: a snake_case, ASCII slug.
 * The title stays human display text; the tag is a rendering-time artifact of
 * it (used by the XML renderer and shown as an editor hint). Empty or symbol-
 * only titles fall back to `section` so the output is always a valid tag.
 */
export function sectionTagName(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics: "diálogo" -> "dialogo"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // non-alphanumeric runs -> single underscore
    .replace(/^_+|_+$/g, ''); // trim leading/trailing underscores
  return slug || 'section';
}
