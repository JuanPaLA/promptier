export interface ReferenceTarget {
  readonly kind: 'section';
  readonly path: readonly number[];
}

export interface ResolvedReference {
  readonly kind: string;
  readonly text: string;
  readonly status: 'resolved' | 'missing' | 'ambiguous';
  readonly target?: ReferenceTarget;
}

export interface ReferenceResolver {
  resolve(text: string): ResolvedReference | null;
}
