import { Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';

/**
 * Document edits expressed as named operations rather than position
 * arithmetic. ProseMirror addresses a tree through flat integer positions, so
 * every caret placement is otherwise an offset whose meaning has to be
 * explained in a comment. Naming the operations keeps the offsets in one file.
 *
 * They take and return a `Transaction` so they compose: an operation can be
 * applied on top of an already-modified transaction, not just on `state.tr`.
 */

/** Replaces `[from, to)` with `block`, caret at the first text position inside it. */
export function replaceRangeWithBlock(
  transaction: Transaction,
  from: number,
  to: number,
  block: ProseMirrorNode,
): Transaction {
  return caretInsideBlockAt(transaction.replaceRangeWith(from, to, block), from);
}

/** Inserts `block` at `pos`, caret at the first text position inside it. */
export function insertBlockAt(
  transaction: Transaction,
  pos: number,
  block: ProseMirrorNode,
): Transaction {
  return caretInsideBlockAt(transaction.insert(pos, block), pos);
}

/** Moves the caret to the first text position after the node `$pos` sits in. */
export function caretAfterNode(transaction: Transaction, $pos: ResolvedPos): Transaction {
  const target = transaction.doc.resolve($pos.after());
  return transaction.setSelection(TextSelection.near(target, 1)).scrollIntoView();
}

/** Moves the caret into the document's last block. */
export function caretInLastBlock(transaction: Transaction): Transaction {
  const insideLastBlock = transaction.doc.resolve(transaction.doc.content.size - 1);
  return transaction.setSelection(TextSelection.near(insideLastBlock)).scrollIntoView();
}

/**
 * `blockStart + 1` steps inside the block. For a textblock that is already a
 * text position; for a container (a section, a list) it lands between the
 * container's start and its first child, and the forward bias walks on into
 * that child's text. One expression covers every block shape.
 */
function caretInsideBlockAt(transaction: Transaction, blockStart: number): Transaction {
  const inside = transaction.doc.resolve(blockStart + 1);
  return transaction.setSelection(TextSelection.near(inside, 1)).scrollIntoView();
}
