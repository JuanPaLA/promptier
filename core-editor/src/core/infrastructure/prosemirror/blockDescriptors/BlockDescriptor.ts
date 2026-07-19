import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { NodeViewConstructor } from 'prosemirror-view';
import type { Block } from '../../../domain/Block';

/**
 * Everything the ProseMirror infrastructure needs from a single block type:
 * its schema node, both mapping directions, and any editor plugins it
 * contributes (input rules, keymaps, node views).
 *
 * The schema is passed in rather than imported, because the schema itself is
 * assembled from every block's `nodeSpec` — importing it here would be a cycle.
 * For the same reason container blocks receive `mapChild` instead of calling
 * the registry: mapping recursion is injected, not imported.
 */
export interface BlockDescriptor<B extends Block = Block> {
  /** Doubles as the ProseMirror node name (schema key). */
  readonly blockType: B['blockType'];
  readonly nodeSpec: NodeSpec;
  /** Auxiliary schema nodes this block needs besides its own (e.g. section's title). */
  readonly extraNodes?: Record<string, NodeSpec>;
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
