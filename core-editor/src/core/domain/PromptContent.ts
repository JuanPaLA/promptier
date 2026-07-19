import type { Block } from './Block';

export const PROMPT_CONTENT_VERSION = 1;

/**
 * The serializable document the editor emits and consumes. Hosts treat it as
 * an opaque value: persist it anywhere, feed it back, render via toMarkdown.
 * `version` guards long-lived stored documents against format evolution.
 */
export interface PromptContent {
  version: typeof PROMPT_CONTENT_VERSION;
  blocks: Block[];
}
