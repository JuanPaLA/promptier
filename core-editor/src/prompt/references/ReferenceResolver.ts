export interface ReferenceTarget {
  readonly kind: 'section';
  readonly path: readonly number[];
}

export interface ResolvedReference {
  readonly kind: 'section' | 'tool' | 'parameter';
  readonly text: string;
  readonly status: 'resolved' | 'missing' | 'ambiguous';
  readonly target?: ReferenceTarget;
  /** Describes a referenced target that lives outside the document. */
  readonly detail?: string;
}

export interface ReferenceResolver {
  resolve(text: string): ResolvedReference | null;
}
