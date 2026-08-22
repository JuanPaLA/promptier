import { describe, expect, it } from 'vitest';

import { sectionAtPath } from '../../../src/engine/prosemirror/commands/navigateCommand';
import { promptSchema } from '../../../src/engine/prosemirror/descriptors/promptSchema';
import { toProseMirrorDoc } from '../../../src/engine/prosemirror/mapping/documentMapper';
import type { PromptContent } from '../../../src/prompt/model/PromptContent';

const prompt: PromptContent = {
  blocks: [
    { blockType: 'paragraph', content: [{ text: 'intro' }] },
    {
      blockType: 'section',
      title: 'Rules',
      children: [
        { blockType: 'paragraph', content: [{ text: 'be concise' }] },
        {
          blockType: 'section',
          title: 'Style',
          children: [{ blockType: 'paragraph', content: [{ text: 'be warm' }] }],
        },
      ],
    },
  ],
};

describe('navigate command paths', () => {
  const document = toProseMirrorDoc(prompt, promptSchema);

  it('resolves top-level and nested section paths', () => {
    const rules = sectionAtPath(document, [1]);
    const style = sectionAtPath(document, [1, 1]);

    expect(rules?.node.firstChild?.textContent).toBe('Rules');
    expect(style?.node.firstChild?.textContent).toBe('Style');
    expect(style?.position).toBeGreaterThan(rules?.position ?? 0);
  });

  it('rejects paths that do not identify a section', () => {
    expect(sectionAtPath(document, [])).toBeNull();
    expect(sectionAtPath(document, [0])).toBeNull();
    expect(sectionAtPath(document, [1, 4])).toBeNull();
  });
});
