import type { Block } from './Block';

/**
 * The serializable document the editor emits and consumes. Hosts treat it as
 * an opaque value: persist it anywhere, feed it back, render via `serialize`.
 */
export interface PromptContent {
  blocks: Block[];
}
