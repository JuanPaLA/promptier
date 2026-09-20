import type { EditorView } from 'prosemirror-view';
import { EditorState as ProseMirrorState, type Transaction } from 'prosemirror-state';
import { describe, expect, it, vi } from 'vitest';

import type { InsertBlockCommand } from '../src/editor/commands/InsertBlockCommand';
import type { CommandState } from '../src/editor/commands/CommandState';
import { BlockCommands } from '../src/engine/prosemirror/commands/BlockCommands';
import {
  blockRegistry,
  documentMapper,
  promptSchema,
} from '../src/engine/prosemirror/proseMirrorConfiguration';
import type { PromptContent } from '../src/prompt/model/PromptContent';
import { blockCodecRegistry } from '../src/prompt/serialization/codecs/blockCodecRegistry';
import { parse } from '../src/prompt/serialization/parse';
import { serialize } from '../src/prompt/serialization/serialize';

describe('block extension seams', () => {
  it('registers the same block types for serialization and ProseMirror', () => {
    expect(blockRegistry.all().map(({ blockType }) => blockType)).toEqual(
      blockCodecRegistry.all().map(({ blockType }) => blockType),
    );
  });

  it('round-trips quote through its codec contribution', () => {
    const content: PromptContent = {
      blocks: [
        {
          blockType: 'quote',
          content: [{ text: 'important', formats: ['bold', 'italic'] }],
        },
      ],
    };

    expect(serialize(content)).toBe('> **_important_**');
    expect(parse(serialize(content))).toEqual(content);
  });

  it('derives paragraph escaping from registered block codecs', () => {
    const content: PromptContent = {
      blocks: [{ blockType: 'paragraph', content: [{ text: '> literal quote marker' }] }],
    };

    expect(serialize(content)).toBe('\\> literal quote marker');
    expect(parse(serialize(content))).toEqual(content);
  });

  it('lets opaque blocks consume section-like text during recursive parsing', () => {
    const content: PromptContent = {
      blocks: [
        {
          blockType: 'section',
          title: 'outer',
          children: [
            { blockType: 'codeBlock', code: '</outer>' },
            { blockType: 'quote', content: [{ text: 'still inside' }] },
          ],
        },
      ],
    };

    expect(parse(serialize(content))).toEqual(content);
  });

  it('derives insertion commands and styles from block descriptors', () => {
    const commands = new BlockCommands(blockRegistry, documentMapper);
    const state = stateWithParagraph();

    const insertionStates = commands.commandStates(state).filter(isBlockInsertionState);
    expect(insertionStates.map(({ command }) => command.block.blockType)).toEqual([
      'paragraph', 'heading', 'codeBlock', 'orderedList', 'unorderedList', 'quote', 'section',
    ]);
    expect(insertionStates.every(({ enabled }) => enabled)).toBe(true);
    expect(blockRegistry.editorStyles().join('\n')).toContain('.prompt-quote');
  });

  it('inserts a descriptor-provided block without block-specific command logic', () => {
    const commands = new BlockCommands(blockRegistry, documentMapper);
    const state = stateWithParagraph();
    let dispatched: Transaction | undefined;
    const focus = vi.fn();
    const view = {
      state,
      dispatch: (transaction: Transaction) => {
        dispatched = transaction;
      },
      focus,
    } as unknown as EditorView;
    const command: InsertBlockCommand = {
      type: 'block.insert',
      block: { blockType: 'quote', content: [] },
    };

    expect(commands.run(view, command)).toBe(true);
    expect(documentMapper.fromDocument(dispatched!.doc)).toEqual({
      blocks: [
        { blockType: 'paragraph', content: [{ text: 'before' }] },
        { blockType: 'quote', content: [] },
      ],
    });
    expect(focus).toHaveBeenCalledOnce();
  });
});

function isBlockInsertionState(state: CommandState): state is CommandState & { command: InsertBlockCommand } {
  return state.command.type === 'block.insert';
}

function stateWithParagraph(): ProseMirrorState {
  return ProseMirrorState.create({
    schema: promptSchema,
    doc: documentMapper.toDocument({
      blocks: [{ blockType: 'paragraph', content: [{ text: 'before' }] }],
    }),
  });
}
