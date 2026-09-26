import type { ToolCatalog } from '../tools/ToolCatalog';
import type { ToolMention, ToolParameter } from '../tools/ToolDefinition';
import type { ReferenceResolver } from './ReferenceResolver';

export function toolReferences(catalog: ToolCatalog): ReferenceResolver {
  return {
    resolve(text) {
      const mention = catalog.resolve(text);
      return mention && { kind: mention.kind, text, status: 'resolved', detail: describe(mention, catalog) };
    },
  };
}

function describe(mention: ToolMention, catalog: ToolCatalog): string {
  if (mention.kind === 'parameter') {
    return mention.parameters.map((parameter) => withDescription(
      `${parameter.tool}.${parameter.path}${typeOf(parameter)} (${parameter.required ? 'required' : 'optional'})`,
      parameter.description,
    )).join('\n');
  }
  const { tool } = mention;
  const signature = catalog.parameters(tool.name)
    .filter((parameter) => !parameter.path.includes('.'))
    .map((parameter) => `${parameter.path}${parameter.required ? '' : '?'}${typeOf(parameter)}`);
  return withDescription(`${tool.name}(${signature.join(', ')})`, tool.description);
}

function typeOf(parameter: ToolParameter): string {
  return parameter.types.length ? `: ${parameter.types.join(' | ')}` : '';
}

function withDescription(label: string, description: string | undefined): string {
  return description ? `${label} — ${description}` : label;
}
