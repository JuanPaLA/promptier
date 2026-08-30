import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

import type { NavigateCommand } from '../../../editor/commands/NavigateCommand';
import type { CommandDescriptor } from './CommandDescriptor';

export const navigateCommand: CommandDescriptor<NavigateCommand> = {
  type: 'navigate',
  availableCommands: () => [],
  run: (view, command) => {
    const target = sectionAtPath(view.state.doc, command.target.path);
    if (!target) return false;
    const selection = Selection.near(view.state.doc.resolve(target.position + 1), 1);
    view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
    view.focus();
    return true;
  },
  isEnabled: (state, command) => sectionAtPath(state.doc, command.target.path) !== null,
  isActive: () => false,
};

interface LocatedSection {
  readonly node: ProseMirrorNode;
  readonly position: number;
}

/** Resolves a domain block path without exposing ProseMirror positions publicly. */
export function sectionAtPath(
  document: ProseMirrorNode,
  path: readonly number[],
): LocatedSection | null {
  if (path.length === 0) return null;

  let parent = document;
  let parentContentPosition = 0;
  let target: LocatedSection | null = null;

  for (const [depth, blockIndex] of path.entries()) {
    if (!Number.isInteger(blockIndex) || blockIndex < 0) return null;
    const childIndex = depth === 0 ? blockIndex : blockIndex + 1;
    if (childIndex >= parent.childCount) return null;

    let position = parentContentPosition;
    for (let index = 0; index < childIndex; index += 1) {
      position += parent.child(index).nodeSize;
    }

    const node = parent.child(childIndex);
    target = { node, position };
    if (depth < path.length - 1) {
      if (node.type.name !== 'section') return null;
      parent = node;
      parentContentPosition = position + 1;
    }
  }

  return target?.node.type.name === 'section' ? target : null;
}
