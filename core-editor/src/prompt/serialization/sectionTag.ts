/**
 * Derives a section's tag from its title: a snake_case, ASCII slug. The tag is
 * the section's identity — its serialized XML tag, its outline anchor and its
 * id are this one value. Empty or symbol-only titles fall back to `section` so
 * the output is always a valid tag.
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

/**
 * The inverse, as far as slugging allows. Case and diacritics were dropped on
 * the way out and cannot be recovered, so a title degrades once on its first
 * round trip and is stable from then on:
 * `sectionTagName(sectionTitleFromTag(tag)) === tag`.
 */
export function sectionTitleFromTag(tag: string): string {
  return tag.replace(/_/g, ' ');
}
