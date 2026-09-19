import { TemplateSyntax } from '../templates/TemplateSyntax';
import { VariableCatalog } from './VariableCatalog';
import type { VariableResolution } from './VariableSchema';

export interface VariableMention extends VariableResolution {
  readonly start: number;
  readonly end: number;
  readonly path: string;
}

export class VariableAnalysis {
  private readonly syntax = new TemplateSyntax();

  constructor(private readonly catalog: VariableCatalog) {}

  mentions(text: string, hasExternalScope = false): readonly VariableMention[] {
    const tokens = this.syntax.tokens(text);
    const uncertainScope = hasExternalScope || tokens.some((token) => token.kind === 'statement');
    return tokens.flatMap((token) => {
      const path = token.body.trim();
      if (token.kind !== 'expression' || !token.complete || !VariableCatalog.isPath(path)) return [];
      return [{ start: token.start, end: token.end, path,
        ...(uncertainScope ? { status: 'unverified' as const } : this.catalog.resolve(path)),
      }];
    });
  }
}
