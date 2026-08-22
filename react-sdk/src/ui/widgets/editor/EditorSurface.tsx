/// <reference path="../../../custom-elements.d.ts" />
export interface EditorSurfaceProps {
  readonly mountOn: (element: HTMLElement | null) => void;
}

export function EditorSurface({ mountOn }: EditorSurfaceProps) {
  return (
    <div className="promptier-surface">
      <prompt-editor ref={mountOn} />
    </div>
  );
}
