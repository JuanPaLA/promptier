export interface InsertReferenceCommand {
  readonly type: 'reference.insert';
  readonly text: string;
}
