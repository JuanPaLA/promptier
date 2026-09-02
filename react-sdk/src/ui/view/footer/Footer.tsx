export interface FooterProps {
  readonly charsLength: number;
  readonly wordCount: number;
  readonly tokenCount?: number;
}

export function Footer({ charsLength, wordCount, tokenCount }: FooterProps) {
  return (
    <footer className="promptier-footer" aria-label="Document statistics">
      <span>Characters: {charsLength}</span>
      <span>Words: {wordCount}</span>
      {tokenCount !== undefined && <span>Tokens: {tokenCount}</span>}
    </footer>
  );
}
