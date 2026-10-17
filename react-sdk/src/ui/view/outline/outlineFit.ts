const OUTLINE_WIDTH_REM = 15;
const MIN_EDITING_WIDTH_REM = 28;

/** The outline opens on mount only when the editing area keeps a comfortable width beside it. */
export const OUTLINE_MIN_CONTAINER_REM = OUTLINE_WIDTH_REM + MIN_EDITING_WIDTH_REM;

export function outlineFitsContainer(containerWidthPx: number, remPx: number): boolean {
  return containerWidthPx >= OUTLINE_MIN_CONTAINER_REM * remPx;
}
