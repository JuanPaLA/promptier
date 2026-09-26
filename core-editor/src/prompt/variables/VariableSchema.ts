import type { JsonSchema, JsonSchemaType } from '../schema/JsonSchema';

export type VariableType = JsonSchemaType;

/** The shape of the context a host exposes to its template engine. */
export type VariableSchema = JsonSchema;

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
