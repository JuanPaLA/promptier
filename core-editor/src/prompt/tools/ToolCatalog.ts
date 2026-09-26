import { SchemaCatalog } from '../schema/SchemaCatalog';
import type { ToolDefinition, ToolMention, ToolParameter } from './ToolDefinition';

/** The host's tools, and the mention text that unambiguously names them or their declared parameters. */
export class ToolCatalog {
  private readonly toolsByName = new Map<string, ToolDefinition>();
  private readonly parametersByTool = new Map<string, readonly ToolParameter[]>();

  constructor(tools: readonly ToolDefinition[] = []) {
    for (const tool of tools) {
      if (this.toolsByName.has(tool.name)) continue;
      this.toolsByName.set(tool.name, tool);
      this.parametersByTool.set(tool.name, parametersOf(tool));
    }
  }

  /**
   * `name` and `name()` name a tool; `name.path` a parameter of that tool; a
   * bare `path` every tool parameter declared at that path.
   */
  resolve(text: string): ToolMention | null {
    const tool = this.toolsByName.get(text.endsWith('()') ? text.slice(0, -2) : text);
    if (tool) return { kind: 'tool', tool };
    const parameters = this.parametersNamed(text);
    return parameters.length ? { kind: 'parameter', parameters } : null;
  }

  tools(): readonly ToolDefinition[] {
    return [...this.toolsByName.values()];
  }

  parameters(tool: string): readonly ToolParameter[] {
    return this.parametersByTool.get(tool) ?? [];
  }

  private parametersNamed(text: string): readonly ToolParameter[] {
    const separator = text.indexOf('.');
    const owner = separator > 0 ? this.parametersByTool.get(text.slice(0, separator)) : undefined;
    if (owner) return owner.filter((parameter) => parameter.path === text.slice(separator + 1));
    return [...this.parametersByTool.values()].flat().filter((parameter) => parameter.path === text);
  }
}

function parametersOf(tool: ToolDefinition): readonly ToolParameter[] {
  if (!tool.parameters) return [];
  return new SchemaCatalog(tool.parameters).properties()
    .map(({ container, ...property }) => ({ tool: tool.name, ...property }));
}
