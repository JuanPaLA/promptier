import type { EditorView } from 'prosemirror-view';

import type { EditorCommand } from '../../../editor/commands/EditorCommand';
import type { CommandHandler } from './CommandHandler';

export class EditorCommandRegistry {
  private readonly handlersByType = new Map<EditorCommand['type'], CommandHandler>();

  constructor(handlers: readonly CommandHandler[]) {
    handlers.forEach((handler) => this.register(handler));
  }

  run(view: EditorView, command: EditorCommand): boolean {
    return this.handlersByType.get(command.type)?.run(view, command) ?? false;
  }

  private register(handler: CommandHandler): void {
    if (this.handlersByType.has(handler.type)) {
      throw new Error(`A command handler is already registered for "${handler.type}".`);
    }
    this.handlersByType.set(handler.type, handler);
  }
}
