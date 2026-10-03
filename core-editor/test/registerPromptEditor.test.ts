import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeCustomElementRegistry {
  private readonly definitions = new Map<string, CustomElementConstructor>();

  readonly define = vi.fn((name: string, constructor: CustomElementConstructor) => {
    this.definitions.set(name, constructor);
  });

  get(name: string): CustomElementConstructor | undefined {
    return this.definitions.get(name);
  }
}

describe('registerPromptEditor', () => {
  let registry: FakeCustomElementRegistry;

  beforeEach(() => {
    registry = new FakeCustomElementRegistry();
    vi.stubGlobal('customElements', registry);
    vi.stubGlobal('HTMLElement', class {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defines the element once however many times it is registered', async () => {
    const { registerPromptEditor } = await import('../src/PromptEditorElement');

    registerPromptEditor();
    registerPromptEditor();

    expect(registry.define).toHaveBeenCalledTimes(1);
  });

  it('recognizes the element registered by another copy of the module', async () => {
    const first = await import('../src/PromptEditorElement');
    first.registerPromptEditor();

    vi.resetModules();
    const second = await import('../src/PromptEditorElement');

    expect(() => second.registerPromptEditor()).not.toThrow();
    expect(registry.define).toHaveBeenCalledTimes(1);
  });

  it('refuses a tag name taken by some other element', async () => {
    registry.define('prompt-editor', class {} as unknown as CustomElementConstructor);
    registry.define.mockClear();
    const { registerPromptEditor } = await import('../src/PromptEditorElement');

    expect(() => registerPromptEditor()).toThrow(/already in use/);
    expect(registry.define).not.toHaveBeenCalled();
  });
});
