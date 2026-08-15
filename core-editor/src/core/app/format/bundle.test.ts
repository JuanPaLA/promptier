import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the promise the `format` entry point makes: it runs on a developer's
 * server, so it must import in Node with no DOM and must not drag the editor in
 * behind it. Neither is visible in the source — a stray import three files deep
 * would break both — so these assert against the *built* bundle.
 *
 * Skipped when `dist` is absent so `yarn test` works in a fresh clone; run
 * `yarn workspace core-editor build` first to exercise them.
 */
const bundle = fileURLToPath(new URL('../../../../dist/format.js', import.meta.url));
const built = existsSync(bundle);

describe.skipIf(!built)('the format bundle', () => {
  it('carries no ProseMirror', () => {
    expect(readFileSync(bundle, 'utf8')).not.toMatch(/prosemirror/i);
  });

  it('touches no browser global', () => {
    expect(readFileSync(bundle, 'utf8')).not.toMatch(/\b(document|window|customElements)\./);
  });

  it('round-trips a prompt when imported in Node', async () => {
    const { parse, serialize } = await import(bundle);
    const text = '<goals>\nBe **fast**.\n</goals>';
    expect(serialize(parse(text))).toBe(text);
  });
});
