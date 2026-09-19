import type { VariableDefinition, VariableResolution, VariableSchema, VariableType } from './VariableSchema';

export class VariableCatalog {
  constructor(private readonly schema?: VariableSchema) {}

  resolve(path: string): VariableResolution {
    if (!VariableCatalog.isPath(path) || !this.schema) return { status: 'unverified' };
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
    return { status: declared ? 'recognized' : 'unverified', definition: this.definition(path, current, required) };
  }

  definitions(): readonly VariableDefinition[] {
    const result: VariableDefinition[] = [];
    if (this.schema) this.collect(this.schema, '', true, result, new Set());
    return result;
  }

  static isPath(path: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(path)
      && !['true', 'false', 'null', 'none'].includes(path.split('.')[0]);
  }

  private types(schema: VariableSchema): readonly VariableType[] {
    return typeof schema.type === 'string' ? [schema.type] : schema.type ?? [];
  }

  private definition(path: string, schema: VariableSchema, required: boolean): VariableDefinition {
    const types = this.types(schema);
    return { path, types, required, title: schema.title, description: schema.description,
      insertable: !types.includes('object') && !types.includes('array') && !schema.properties && !schema.items };
  }

  private collect(schema: VariableSchema, prefix: string, required: boolean, result: VariableDefinition[], ancestors: Set<VariableSchema>): void {
    if (ancestors.has(schema)) return;
    ancestors.add(schema);
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!VariableCatalog.isPath(path) || key.includes('.')) continue;
      const childRequired = required && (schema.required?.includes(key) ?? false) && !this.types(schema).includes('null');
      result.push(this.definition(path, child, childRequired));
      if (!this.types(child).includes('array')) this.collect(child, path, childRequired, result, ancestors);
    }
    ancestors.delete(schema);
  }
}
