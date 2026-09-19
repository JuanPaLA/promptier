export interface InsertVariableCommand {
  readonly type: 'variable.insert';
  readonly path: string;
}
