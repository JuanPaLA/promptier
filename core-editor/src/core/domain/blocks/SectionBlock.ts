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
