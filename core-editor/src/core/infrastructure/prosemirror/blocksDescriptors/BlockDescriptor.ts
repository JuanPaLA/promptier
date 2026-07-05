import { InputRule } from 'prosemirror-inputrules';
import { NodeSpec, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Block } from '../../../domain/Block';

/**
 * Everything the ProseMirror infrastructure needs from a single block type:
 * its schema node, both mapping directions, and any editor plugins it
 * contributes (input rules today; keymaps/commands/node views later).
 *
 * The schema is passed in rather than imported, because the schema itself is
 * assembled from every block's `nodeSpec` — importing it here would be a cycle.
 */
export interface BlockDescriptor<B extends Block = Block> {
  /** Doubles as the ProseMirror node name (schema key). */
  readonly blockType: B['blockType'];
  readonly nodeSpec: NodeSpec;
  toProseMirrorNode(block: B, schema: Schema): ProseMirrorNode;
  fromProseMirrorNode(node: ProseMirrorNode): B;
  inputRules?(schema: Schema): InputRule[];
}
