import type { JsonSchema, JsonSchemaType } from './JsonSchema';

export interface SchemaProperty {
  readonly path: string;
  readonly types: readonly JsonSchemaType[];
  readonly title?: string;
  readonly description?: string;
  readonly required: boolean;
  readonly container: boolean;
}

export interface SchemaResolution {
  readonly status: 'recognized' | 'unknown' | 'unverified';
  readonly property?: SchemaProperty;
}

/** Dotted property paths of an object schema. Paths never traverse list items. */
export class SchemaCatalog {
  constructor(private readonly schema: JsonSchema) {}

  resolve(path: string): SchemaResolution {
    let current = this.schema;
    let required = true;
    let declared = true;
    for (const key of path.split('.')) {
      const types = this.types(current);
      if (types.length && !types.includes('object')) return { status: 'unknown' };
      const child = Object.prototype.hasOwnProperty.call(current.properties ?? {}, key)
        ? current.properties![key] : undefined;
      required = required && (current.required?.includes(key) ?? false) && !types.includes('null');
      if (child) current = child;
      else if (current.additionalProperties === false) return { status: 'unknown' };
      else if (typeof current.additionalProperties === 'object') {
        current = current.additionalProperties;
        declared = false;
      } else return { status: 'unverified' };
    }
    return { status: declared ? 'recognized' : 'unverified', property: this.property(path, current, required) };
  }

  /** Every explicitly declared path, parents before their children. */
  properties(): readonly SchemaProperty[] {
    const result: SchemaProperty[] = [];
    this.collect(this.schema, '', true, result, new Set());
    return result;
  }

  static isPath(path: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(path);
  }

  private types(schema: JsonSchema): readonly JsonSchemaType[] {
    return typeof schema.type === 'string' ? [schema.type] : schema.type ?? [];
  }

  private property(path: string, schema: JsonSchema, required: boolean): SchemaProperty {
    const types = this.types(schema);
    return { path, types, required, title: schema.title, description: schema.description,
      container: types.includes('object') || types.includes('array') || !!schema.properties || !!schema.items };
  }

  private collect(schema: JsonSchema, prefix: string, required: boolean, result: SchemaProperty[], ancestors: Set<JsonSchema>): void {
    if (ancestors.has(schema)) return;
    ancestors.add(schema);
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!SchemaCatalog.isPath(path) || key.includes('.')) continue;
      const childRequired = required && (schema.required?.includes(key) ?? false) && !this.types(schema).includes('null');
      result.push(this.property(path, child, childRequired));
      if (!this.types(child).includes('array')) this.collect(child, path, childRequired, result, ancestors);
    }
    ancestors.delete(schema);
  }
}
