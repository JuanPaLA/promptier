import { describe, expect, it } from 'vitest';

import type { TokenEstimator } from '../src/lib/TokenEstimator';
import { TokenxEstimator } from '../src/lib/TokenEstimator';
import { PromptEditorVM } from '../src/ui/view/PromptEditorVM';

const viewModelFor = (prompt: string, estimator: TokenEstimator = { estimate: () => 0 }) =>
  PromptEditorVM.from({ prompt, content: { blocks: [] }, state: null }, estimator);

describe('prompt statistics', () => {
  it('counts no words in an empty prompt', () => {
    expect(viewModelFor('').wordCount).toBe(0);
  });

  it('splits words on any whitespace, including line breaks', () => {
    expect(viewModelFor('one  two\nthree\t four ').wordCount).toBe(4);
  });

  it('takes the token count from the injected estimator', () => {
    const estimator = { estimate: (text: string) => text.length * 2 };

    expect(viewModelFor('abc', estimator).tokenCount).toBe(6);
  });
});

describe('TokenxEstimator', () => {
  const estimator = new TokenxEstimator();

  it('estimates zero tokens for empty text', () => {
    expect(estimator.estimate('')).toBe(0);
  });

  it('estimates more tokens for longer text', () => {
    expect(estimator.estimate('hello world, this is a longer sentence')).toBeGreaterThan(
      estimator.estimate('hello'),
    );
  });
});
