import { describe, expect, it, vi } from 'vitest';

import type {
  EditorCommand,
  EditorStateSnapshot,
  PromptContent,
} from 'core-editor';
import { PromptEditorService } from '../../src/app/PromptEditorService';

describe('PromptEditorService', () => {
  it('publishes initial element state when it attaches', () => {
    const service = new PromptEditorService();
    const listener = vi.fn();
    const element = new FakePromptEditorElement('hello');
    service.subscribe(listener);

    service.attach(asHtmlElement(element));

    expect(service.getSnapshot()).toEqual({
      prompt: 'hello',
      content: element.content,
      state: element.getState(),
    });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('applies a prompt queued before the element attaches', () => {
    const service = new PromptEditorService();
    const element = new FakePromptEditorElement('');

    service.setPrompt('seeded');
    service.attach(asHtmlElement(element));

    expect(element.value).toBe('seeded');
    expect(service.getSnapshot().prompt).toBe('seeded');
  });

  it('publishes writes and retains the last prompt when it detaches', () => {
    const service = new PromptEditorService();
    const element = new FakePromptEditorElement('initial');
    service.attach(asHtmlElement(element));

    service.setPrompt('updated');
    service.attach(null);

    expect(service.getSnapshot()).toMatchObject({
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
