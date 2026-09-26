export interface InsertToolCommand {
  readonly type: 'tool.insert';
  readonly tool: string;
  readonly parameter?: string;
}
