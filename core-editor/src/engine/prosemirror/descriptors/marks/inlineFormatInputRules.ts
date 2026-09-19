import { InputRule } from 'prosemirror-inputrules';
import type { MarkType, Schema } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';

import type { InlineFormatCodec } from '../../../../prompt/serialization/formats/InlineFormatCodec';
import type { InlineFormatRegistry } from '../../../../prompt/serialization/formats/InlineFormatRegistry';
import { hasUnfinishedSectionTag } from '../../../../prompt/serialization/sectionTagSyntax';
import { TemplateSyntax } from '../../../../prompt/templates/TemplateSyntax';

export function createInlineFormatInputRules(
  schema: Schema,
  formats: InlineFormatRegistry,
): readonly InputRule[] {
  return formats.all().map((codec) => createInlineFormatInputRule(schema, codec));
}

function createInlineFormatInputRule(
  schema: Schema,
  codec: InlineFormatCodec,
): InputRule {
  const markType = schema.marks[codec.format];
  if (!markType) {
    throw new Error(`No ProseMirror mark is registered for format "${codec.format}".`);
  }

  return new InputRule(formatPattern(codec), (state, match, start, end) =>
    applyFormat(state, match, start, end, codec, markType),
  );
}

function applyFormat(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number,
  codec: InlineFormatCodec,
  markType: MarkType,
): Transaction | null {
  const content = match[1];
  if (!content || isEscaped(state, start)) return null;
  const position = state.doc.resolve(start);
  const before = position.parent.textBetween(0, position.parentOffset);
  if (hasUnfinishedSectionTag(before) || hasUnfinishedSectionTag(before + match[0])) return null;
  const templateTokens = new TemplateSyntax().tokens(before + match[0]);
  if (templateTokens.some((token) =>
    (token.start <= before.length && token.end > before.length)
    || token.end === before.length + match[0].length)) return null;

  const existingText = state.doc.textBetween(start, end, '', '\ufffc');
  if (!match[0].startsWith(existingText)) return null;

  const typedText = match[0].slice(existingText.length);
  const contentStart = start + codec.openingDelimiter.length;
  const contentEnd = contentStart + content.length;
  const matchEnd = start + match[0].length;
  const transaction = state.tr.insertText(typedText, end);

  transaction.delete(contentEnd, matchEnd);
  transaction.delete(start, contentStart);
  transaction.addMark(start, start + content.length, markType.create());
  transaction.removeStoredMark(markType);
  return transaction;
}

function formatPattern(codec: InlineFormatCodec): RegExp {
  const opening = escapeRegExp(codec.openingDelimiter);
  const closing = escapeRegExp(codec.closingDelimiter);
  const delimiter = alternation(opening, closing);
  return new RegExp(`${opening}((?:(?!${delimiter})[\\s\\S])+?)${closing}$`);
}

function alternation(left: string, right: string): string {
  return left === right ? left : `(?:${left}|${right})`;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isEscaped(state: EditorState, start: number): boolean {
  let position = start - 1;
  let backslashes = 0;

  while (position > 0 && state.doc.textBetween(position, position + 1) === '\\') {
    backslashes += 1;
    position -= 1;
  }

  return backslashes % 2 === 1;
}
