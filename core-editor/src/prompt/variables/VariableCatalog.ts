import { SchemaCatalog, type SchemaProperty } from '../schema/SchemaCatalog';
import type { VariableDefinition, VariableResolution, VariableSchema } from './VariableSchema';

export class VariableCatalog {
  private readonly schema?: SchemaCatalog;

  constructor(schema?: VariableSchema) {
    this.schema = schema && new SchemaCatalog(schema);
  }

  resolve(path: string): VariableResolution {
    if (!VariableCatalog.isPath(path) || !this.schema) return { status: 'unverified' };
    const { status, property } = this.schema.resolve(path);
    return property ? { status, definition: definition(property) } : { status };
  }

  definitions(): readonly VariableDefinition[] {
    return (this.schema?.properties() ?? [])
      .filter((property) => VariableCatalog.isPath(property.path))
      .map(definition);
  }

  static isPath(path: string): boolean {
    return SchemaCatalog.isPath(path) && !PEBBLE_LITERALS.includes(path.split('.')[0]);
  }
}

const PEBBLE_LITERALS = ['true', 'false', 'null', 'none'];

function definition({ container, ...property }: SchemaProperty): VariableDefinition {
  return { ...property, insertable: !container };
}
