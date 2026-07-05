import { InputRule } from 'prosemirror-inputrules';
import { MarkSpec, Schema } from 'prosemirror-model';
import { Command } from 'prosemirror-state';
import { Format } from '../../../domain/BlockContent';
import { boldMarkDescriptor } from './BoldDescriptor';
import { codeMarkDescriptor } from './CodeDescriptor';
import { MarkDescriptor } from './MarkDescriptor';

type MarkDescriptorRegistry = {
  [K in Format]: MarkDescriptor;
};

const markRegistry: MarkDescriptorRegistry = {
  bold: boldMarkDescriptor,
  code: codeMarkDescriptor,
};

export const markDescriptors = Object.values(markRegistry);

export function markSpecs(): Record<string, MarkSpec> {
  const specs: Record<string, MarkSpec> = {};
  for (const descriptor of markDescriptors) {
    specs[descriptor.format] = descriptor.markSpec;
  }
  return specs;
}

export function markKeymaps(schema: Schema): Record<string, Command> {
  return markDescriptors.reduce<Record<string, Command>>(
    (keymaps, descriptor) => ({ ...keymaps, ...(descriptor.keymap?.(schema) ?? {}) }),
    {},
  );
}

export function markInputRules(schema: Schema): InputRule[] {
  return markDescriptors.flatMap((descriptor) => descriptor.inputRules?.(schema) ?? []);
}
