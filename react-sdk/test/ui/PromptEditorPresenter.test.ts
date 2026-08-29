import { describe, expect, it, vi } from 'vitest';

import type {
  EditorCommand,
  EditorStateSnapshot,
  PromptContent,
} from 'core-editor';
import { PromptEditorService } from '../../src/app/PromptEditorService';
import {
  PromptEditorPresenter,
  type PromptEditorPresenterProps,
} from '../../src/ui/PromptEditorPresenter';

describe('PromptEditorPresenter', () => {
  it('derives command and outline view models from editor state', () => {
    const { presenter, service } = createPresenter();
    const element = new FakePromptEditorElement();

    service.attach(asHtmlElement(element));

    expect(presenter.model.commandItems).toEqual([
      {
        id: 'format.bold',
        group: 'format',
        label: 'Bold',
        glyph: 'B',
        shortcut: 'Ctrl+B',
        disabled: false,
        active: true,
      },
      {
        id: 'format.code',
        group: 'format',
        label: 'Inline code',
        glyph: '</>',
        shortcut: 'Ctrl+`',
        disabled: true,
        active: false,
      },
    ]);
    expect(presenter.model.outlineItems).toEqual([
      { id: 'section:0', label: 'Context', depth: 0 },
    ]);
  });

  it('translates view actions back into core commands', () => {
    const { presenter, service } = createPresenter();
    const element = new FakePromptEditorElement();
    service.attach(asHtmlElement(element));

    presenter.runCommand('format.bold');
    presenter.selectOutlineItem('section:0');

    expect(element.commands).toEqual([
      { type: 'format', format: 'bold' },
      { type: 'navigate', target: { kind: 'section', path: [0] } },
    ]);
  });

  it('reconciles host values without reporting their echo as an edit', () => {
    const onChange = vi.fn();
    const initialProps = { value: 'seeded', onChange };
    const { presenter, service } = createPresenter(initialProps);
    const element = new FakePromptEditorElement();
    service.attach(asHtmlElement(element));

    expect(element.value).toBe('seeded');
    expect(onChange).not.toHaveBeenCalled();

    element.edit('edited');

    expect(onChange).toHaveBeenCalledWith('edited');

    const nextProps = { value: 'reset', onChange };
    presenter.update(initialProps, nextProps);

    expect(element.value).toBe('reset');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

function createPresenter(props: PromptEditorPresenterProps = {}) {
  const service = new PromptEditorService();
  const presenter = new PromptEditorPresenter(vi.fn(), service);
  presenter.init(props);
  presenter.start();
  return { presenter, service };
}

class FakePromptEditorElement extends EventTarget {
  content: PromptContent = {
    blocks: [
      {
        blockType: 'section',
        title: 'Context',
        children: [{ blockType: 'paragraph', content: [] }],
      },
    ],
  };
  readonly commands: EditorCommand[] = [];
  value = '';

  edit(prompt: string): void {
    this.value = prompt;
    this.dispatchEvent(new Event('change'));
  }

  run(command: EditorCommand): boolean {
    this.commands.push(command);
    return true;
  }

  availableCommands(): readonly EditorCommand[] {
    return this.getState().commands.map((state) => state.command);
  }

  getState(): EditorStateSnapshot {
    return {
      selection: { activeFormats: ['bold'], empty: false },
      commands: [
        {
          command: { type: 'format', format: 'bold' },
          enabled: true,
          active: true,
        },
        {
          command: { type: 'format', format: 'code' },
          enabled: false,
          active: false,
        },
      ],
    };
  }
}

function asHtmlElement(element: FakePromptEditorElement): HTMLElement {
  return element as unknown as HTMLElement;
}
