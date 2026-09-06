import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { NavigateCommand } from '../../../editor/commands/NavigateCommand';
import type { CommandHandler } from './CommandHandler';

interface LocatedBlock {
  readonly node: ProseMirrorNode;
  readonly position: number;
}

export class NavigateCommands implements CommandHandler<NavigateCommand> {
  readonly type = 'navigate';

  run(view: EditorView, command: NavigateCommand): boolean {
    const target = this.blockAtPath(view.state.doc, command.target.path);
    if (!target || target.node.type.name !== command.target.kind) return false;
    this.revealContainingSections(view.nodeDOM(target.position));
    const selection = Selection.near(view.state.doc.resolve(target.position + 1), 1);
    view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
    view.focus();
    return true;
  }

  private blockAtPath(document: ProseMirrorNode, path: readonly number[]): LocatedBlock | null {
    if (path.length === 0) return null;

    let parent = document;
    let parentContentPosition = 0;
    let target: LocatedBlock | null = null;

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

    return target;
  }

  private revealContainingSections(target: Node | null): void {
    if (!target) return;
    const EventConstructor = target.ownerDocument?.defaultView?.Event;
    if (!EventConstructor) return;
    target.dispatchEvent(new EventConstructor(REVEAL_CONTAINING_SECTIONS_EVENT, { bubbles: true }));
  }
}

export const REVEAL_CONTAINING_SECTIONS_EVENT = 'promptier-reveal-containing-sections';
