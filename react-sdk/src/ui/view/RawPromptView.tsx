export function RawPromptView({ prompt }: { readonly prompt: string }) {
  return (
    <textarea
      className="promptier-raw-surface"
      aria-label="Raw prompt (read only)"
      value={prompt}
      readOnly
      spellCheck={false}
      wrap="soft"
      placeholder="The prompt is empty."
    />
  );
}
