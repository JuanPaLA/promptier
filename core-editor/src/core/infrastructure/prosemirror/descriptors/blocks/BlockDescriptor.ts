import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { NodeViewConstructor } from 'prosemirror-view';
import type { Block } from '../../../../domain/Block';
import type { CommandDescriptor } from '../../commands/CommandDescriptor';

/**
 * Everything the ProseMirror infrastructure needs from a single block type.
 * See docs/architecture.md, "The descriptor seam", for why the schema and the
 * child mapping are injected rather than imported.
 */
export interface BlockDescriptor<B extends Block = Block> {
  /** Doubles as the ProseMirror node name (schema key). */
  readonly blockType: B['blockType'];
  readonly nodeSpec: NodeSpec;
  /** Auxiliary schema nodes this block needs besides its own (e.g. section's title). */
  readonly extraNodes?: Record<string, NodeSpec>;
  /** Host-invocable actions this block contributes (copy, delete, turn into). */
  readonly commands?: readonly CommandDescriptor[];
  toProseMirrorNode(
    block: B,
    schema: Schema,
    mapChild: (block: Block) => ProseMirrorNode,
  ): ProseMirrorNode;
  fromProseMirrorNode(node: ProseMirrorNode, mapChild: (node: ProseMirrorNode) => Block): B;
  inputRules?(schema: Schema): InputRule[];
  keymaps?(schema: Schema): Record<string, Command>;
  readonly nodeView?: NodeViewConstructor;
}
