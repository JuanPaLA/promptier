import type { CodeBlock } from '../../model/blocks/CodeBlock';
import type { BlockCodec } from './BlockCodec';

export const codeBlockCodec: BlockCodec<CodeBlock> = {
  blockType: 'codeBlock',
  parsePriority: 100,
  interruptsParagraph: (line) => FENCE_OPEN.test(line),

  tryParse(cursor) {
    const line = cursor.line();
    if (line === undefined) return null;
    const fence = FENCE_OPEN.exec(line);
    if (fence === null) return null;

    const body: string[] = [];
    let offset = 1;
    while (true) {
      const bodyLine = cursor.line(offset);
      if (bodyLine === undefined || FENCE_CLOSE.test(bodyLine)) break;
      body.push(bodyLine);
      offset += 1;
    }
    if (cursor.line(offset) !== undefined) offset += 1;

    cursor.advance(offset);
    return {
      blockType: 'codeBlock',
      ...(fence[1].length > 0 ? { language: fence[1] } : {}),
      code: body.join('\n'),
    };
  },

  serialize(codeBlock) {
    return `\`\`\`${codeBlock.language ?? ''}\n${codeBlock.code}\n\`\`\``;
  },
};

const FENCE_OPEN = /^```(\w*)\s*$/;
const FENCE_CLOSE = /^```\s*$/;
