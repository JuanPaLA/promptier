export interface OutlineEntry {
  readonly id: string;
  readonly title: string;
  readonly depth: number;
  /** Ephemeral address in the current prompt tree, used by editor commands. */
  readonly path: readonly number[];
}
