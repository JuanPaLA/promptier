import type { Block } from '../../prompt/model/Block';

export interface InsertBlockCommand {
  readonly type: 'block.insert';
  readonly block: Block;
}
