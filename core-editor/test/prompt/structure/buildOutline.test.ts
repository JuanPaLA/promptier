import { describe, expect, it } from 'vitest';
import type { Block } from '../../../src/prompt/model/Block';
import type { PromptContent } from '../../../src/prompt/model/PromptContent';
import { buildOutline } from '../../../src/prompt/structure/buildOutline';

function document(...blocks: Block[]): PromptContent {
  return { blocks };
}

function section(title: string, ...children: Block[]): Block {
  return { blockType: 'section', title, children };
}

const paragraph: Block = { blockType: 'paragraph', content: [{ text: 'text' }] };

describe('outline', () => {
  it('is empty for a document without sections', () => {
    expect(buildOutline(document(paragraph))).toEqual([]);
  });

  it('lists top-level sections in document order', () => {
    const content = document(section('Goals', paragraph), paragraph, section('Rules', paragraph));

    expect(buildOutline(content)).toEqual([
      { id: 'goals', title: 'Goals', depth: 0, path: [0] },
      { id: 'rules', title: 'Rules', depth: 0, path: [2] },
    ]);
  });

  it('nests subsections under their parent, depth-first', () => {
    const content = document(
      section('Dialogue rules', section('Formato', paragraph), section('Estilo', paragraph)),
      section('Closing', paragraph),
    );

    expect(buildOutline(content)).toEqual([
      { id: 'dialogue_rules', title: 'Dialogue rules', depth: 0, path: [0] },
      { id: 'formato', title: 'Formato', depth: 1, path: [0, 0] },
      { id: 'estilo', title: 'Estilo', depth: 1, path: [0, 1] },
      { id: 'closing', title: 'Closing', depth: 0, path: [1] },
    ]);
  });

  it('anchors on the same tag the codec serializes, diacritics included', () => {
    expect(buildOutline(document(section('Reglas de diálogo', paragraph)))).toEqual([
      { id: 'reglas_de_dialogo', title: 'Reglas de diálogo', depth: 0, path: [0] },
    ]);
  });

  it('keeps an untitled section addressable and leaves the placeholder to the UI', () => {
    expect(buildOutline(document(section('', paragraph)))).toEqual([
      { id: 'section', title: '', depth: 0, path: [0] },
    ]);
  });
});
