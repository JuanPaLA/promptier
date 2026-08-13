/**
 * A fenced run of literal text. Carries `code` as a plain string rather than
 * `BlockContent` because code has no segments to format — it is one opaque run,
 * and whitespace inside it is significant.
 */
export interface CodeBlock {
  readonly blockType: 'codeBlock';
  /** Fence info string (e.g. `json`). Absent when the fence names no language. */
  readonly language?: string;
  readonly code: string;
}
