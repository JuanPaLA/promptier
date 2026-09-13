import type { Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import type { EditorState as ProseMirrorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CommandState } from '../../../editor/commands/CommandState';
import type { InsertBlockCommand } from '../../../editor/commands/InsertBlockCommand';
import type { BlockRegistry } from '../descriptors/blocks/BlockRegistry';
import { insertBlockAt } from '../editing/blockTransactions';
import type { PromptDocumentMapper } from '../mapping/PromptDocumentMapper';
import type { CommandHandler } from './CommandHandler';
import type { CommandStateProvider } from './CommandStateProvider';

interface BlockInsertion {
  readonly position: number;
  readonly parent: ProseMirrorNode;
  readonly index: number;
}

export class BlockCommands
  implements CommandHandler<InsertBlockCommand>, CommandStateProvider
{
  readonly type = 'block.insert';

  constructor(
    private readonly blocks: BlockRegistry,
    private readonly documentMapper: PromptDocumentMapper,
  ) {}

  run(view: EditorView, command: InsertBlockCommand): boolean {
    const node = this.documentMapper.toBlock(command.block);
    const insertion = findInsertion(view.state, this.blocks);
    if (!insertion || !canInsert(insertion, node)) return false;
    view.dispatch(insertBlockAt(view.state.tr, insertion.position, node));
    view.focus();
    return true;
  }

  commandStates(state: ProseMirrorState): readonly CommandState[] {
    const insertion = findInsertion(state, this.blocks);
    return this.blocks.defaultBlocks().map((block) => ({
      command: { type: 'block.insert', block },
      enabled: insertion ? canInsert(insertion, this.documentMapper.toBlock(block)) : false,
    }));
  }
}

function findInsertion(
  state: ProseMirrorState,
  blocks: BlockRegistry,
): BlockInsertion | null {
  const { $from } = state.selection;
  const blockDepth = nearestBlockDepth($from, blocks);
  if (blockDepth === null) return null;
  return {
    position: $from.after(blockDepth),
    parent: $from.node(blockDepth - 1),
    index: $from.indexAfter(blockDepth - 1),
  };
}

function nearestBlockDepth($position: ResolvedPos, blocks: BlockRegistry): number | null {
  for (let depth = $position.depth; depth > 0; depth -= 1) {
    if (blocks.has($position.node(depth).type.name)) return depth;
  }
  return null;
}

function canInsert(insertion: BlockInsertion, node: ProseMirrorNode): boolean {
  return insertion.parent.canReplaceWith(insertion.index, insertion.index, node.type);
}
