import { estimateTokenCount } from 'tokenx';

export interface TokenEstimator {
  estimate(text: string): number;
}

/** Approximate, model-agnostic estimate; not an exact tokenizer. */
export class TokenxEstimator implements TokenEstimator {
  estimate(text: string): number {
    return estimateTokenCount(text);
  }
}
