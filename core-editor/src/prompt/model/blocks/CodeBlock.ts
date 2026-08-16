
export interface CodeBlock {
  readonly blockType: 'codeBlock';
  readonly language?: string;
  readonly code: string;
}
