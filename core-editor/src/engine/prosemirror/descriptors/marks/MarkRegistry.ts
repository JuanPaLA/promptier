import type { InputRule } from 'prosemirror-inputrules';
import type { MarkSpec, Schema } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';

import type { Format } from '../../../../prompt/model/Format';
import { combineKeymaps } from '../combineKeymaps';
import type { MarkDescriptor } from './MarkDescriptor';

export type MarkDescriptorMap = {
  [F in Format]: MarkDescriptor<F>;
};

export class MarkRegistry {
  private readonly descriptors: readonly MarkDescriptor[];
  private readonly descriptorsByFormat = new Map<Format, MarkDescriptor>();

  constructor(descriptorsByFormat: MarkDescriptorMap) {
    this.descriptors = Object.entries(descriptorsByFormat).map(([registeredFormat, descriptor]) => {
      if (descriptor.format !== registeredFormat) {
        throw new Error(
          `Mark descriptor registered as "${registeredFormat}" declares "${descriptor.format}".`,
        );
      }
      this.descriptorsByFormat.set(descriptor.format, descriptor);
      return descriptor;
    });
  }

  all(): readonly MarkDescriptor[] {
    return this.descriptors;
  }

  get(format: Format): MarkDescriptor {
    const descriptor = this.descriptorsByFormat.get(format);
    if (!descriptor) throw new Error(`No mark descriptor is registered for "${format}".`);
    return descriptor;
  }

  specs(): Record<string, MarkSpec> {
    return Object.fromEntries(
      this.descriptors.map((descriptor) => [descriptor.format, descriptor.markSpec]),
    );
  }

  inputRules(schema: Schema): readonly InputRule[] {
    return this.descriptors.flatMap((descriptor) => descriptor.inputRules?.(schema) ?? []);
  }

  keymap(schema: Schema): Record<string, Command> {
    return combineKeymaps(
      this.descriptors.map((descriptor) => descriptor.keymap?.(schema) ?? {}),
    );
  }
}
