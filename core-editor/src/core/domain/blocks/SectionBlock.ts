import type { Block } from '../Block';

/**
 * A titled, recursive container of blocks. The title *is* the section's
 * heading: markdown rendering derives `#` depth from nesting, so users never
 * manage heading levels by hand. `description` documents the section's intent
 * (for humans and future structure linting) — it is not rendered.
 */
export interface SectionBlock {
  readonly blockType: 'section';
  /** Stable identity for outline navigation and future cross-references. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: Block[];
}

export function newSectionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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
