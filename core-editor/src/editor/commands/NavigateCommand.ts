export interface NavigateCommand {
  readonly type: 'navigate';
  readonly target: {
    readonly kind: 'section';
    readonly path: readonly number[];
  };
}
