import { describe, expect, it, vi } from 'vitest';

import type {
  EditorCommand,
  EditorStateSnapshot,
  PromptContent,
} from 'core-editor';
import { PromptEditorController } from '../../src/app/PromptEditorController';

describe('PromptEditorController', () => {
  it('publishes initial element state when it attaches', () => {
    const controller = new PromptEditorController();
    const listener = vi.fn();
    const element = new FakePromptEditorElement('hello');
    controller.subscribe(listener);

    controller.attach(asHtmlElement(element));

    expect(controller.getSnapshot()).toEqual({
      ready: true,
      prompt: 'hello',
      content: element.content,
      state: element.getState(),
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('seeds the element from the initial prompt', () => {
    const controller = new PromptEditorController('seeded');
    const element = new FakePromptEditorElement('');

    controller.attach(asHtmlElement(element));

    expect(element.value).toBe('seeded');
    expect(controller.getSnapshot().prompt).toBe('seeded');
  });

  it('publishes writes and retains the last prompt when it detaches', () => {
    const controller = new PromptEditorController();
    const element = new FakePromptEditorElement('initial');
    controller.attach(asHtmlElement(element));

    controller.setPrompt('updated');
    controller.attach(null);

    expect(controller.getSnapshot()).toMatchObject({
      ready: false,
      prompt: 'updated',
      state: null,
    });
  });
});

class FakePromptEditorElement extends EventTarget {
  content: PromptContent = { blocks: [] };
  private prompt: string;

  constructor(prompt: string) {
    super();
    this.prompt = prompt;
  }

  get value(): string {
    return this.prompt;
  }

  set value(prompt: string) {
    this.prompt = prompt;
  }

  run(_command: EditorCommand): boolean {
    return true;
  }

  availableCommands(): readonly EditorCommand[] {
    return [];
  }

  getState(): EditorStateSnapshot {
    return {
      selection: { activeFormats: [], empty: true },
      commands: [],
    };
  }
}

function asHtmlElement(element: FakePromptEditorElement): HTMLElement {
  return element as unknown as HTMLElement;
}
