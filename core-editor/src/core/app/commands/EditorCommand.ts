export type EditorCommand =
  | { id: 'format.bold' }
  | { id: 'format.code' };

export type CommandId = EditorCommand['id'];
