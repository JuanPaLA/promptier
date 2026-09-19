export type VariableType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

/** Supported JSON Schema vocabulary for the context exposed by a host. */
export interface VariableSchema {
  readonly type?: VariableType | readonly VariableType[];
  readonly properties?: Readonly<Record<string, VariableSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | VariableSchema;
  readonly items?: VariableSchema;
  readonly title?: string;
  readonly description?: string;
}

export interface VariableDefinition {
  readonly path: string;
  readonly types: readonly VariableType[];
  readonly title?: string;
  readonly description?: string;
  readonly required: boolean;
  readonly insertable: boolean;
}

export interface VariableResolution {
  readonly status: 'recognized' | 'unknown' | 'unverified';
  readonly definition?: VariableDefinition;
}
