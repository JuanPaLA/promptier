import type { PromptContent } from '../model/PromptContent';
import { buildOutline } from '../structure/buildOutline';
import type { ReferenceResolver } from './ReferenceResolver';

export function sectionReferences(content: PromptContent): ReferenceResolver {
  const sections = buildOutline(content).filter((entry) => entry.kind === 'section');
  return {
    resolve(text) {
      const match = /^<([a-zA-Z][\w-]*)>$/.exec(text);
      if (!match) return null;
      const matches = sections.filter((entry) => entry.id === match[1]);
      return {
        kind: 'section', text,
        status: matches.length === 1 ? 'resolved' : matches.length === 0 ? 'missing' : 'ambiguous',
        ...(matches.length === 1 ? { target: { kind: 'section', path: matches[0].path } as const } : {}),
      };
    },
  };
}
