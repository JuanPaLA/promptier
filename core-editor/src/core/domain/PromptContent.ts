import type { Block } from './Block';

export const PROMPT_CONTENT_VERSION = 2;

/**
 * The serializable document the editor emits and consumes. Hosts treat it as
 * an opaque value: persist it anywhere, feed it back, render via `serialize`.
 * `version` guards long-lived stored documents against format evolution —
 * v2 dropped `SectionBlock.id`, which is now derived from the title.
 */
export interface PromptContent {
  version: typeof PROMPT_CONTENT_VERSION;
  blocks: Block[];
}
