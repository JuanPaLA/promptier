/**
 * One navigable position in a prompt. Derived from the document, never stored:
 * `id` is the section's tag, which is simultaneously its serialized XML tag,
 * its anchor in the rendered editor (`data-section-id`) and its identity.
 *
 * `title` is the raw title, empty string included — a placeholder for untitled
 * sections is the UI's decision, and so is its language.
 */
export interface OutlineEntry {
  readonly id: string;
  readonly title: string;
  /** Nesting depth; 0 for a top-level section. */
  readonly depth: number;
}
