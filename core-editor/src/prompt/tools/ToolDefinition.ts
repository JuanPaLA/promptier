import type { JsonSchema, JsonSchemaType } from '../schema/JsonSchema';

/** A function the host exposes to the model, projected into the supported schema vocabulary. */
export interface ToolDefinition {
  readonly name: string;
  readonly description?: string;
  readonly parameters?: JsonSchema;
}

export interface ToolParameter {
  readonly tool: string;
  readonly path: string;
  readonly types: readonly JsonSchemaType[];
  readonly title?: string;
  readonly description?: string;
  readonly required: boolean;
}

export type ToolMention =
  | { readonly kind: 'tool'; readonly tool: ToolDefinition }
  | { readonly kind: 'parameter'; readonly parameters: readonly ToolParameter[] };
