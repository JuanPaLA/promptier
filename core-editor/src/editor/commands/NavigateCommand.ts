export interface NavigateCommand {
  readonly type: 'navigate';
  readonly target: NavigateTarget;
}

export type NavigateTarget =
  | {
      readonly kind: 'section';
      readonly path: readonly number[];
    }
  | {
      readonly kind: 'heading';
      readonly path: readonly number[];
    };
