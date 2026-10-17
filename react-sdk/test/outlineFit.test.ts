import { describe, expect, it } from 'vitest';

import { OUTLINE_MIN_CONTAINER_REM, outlineFitsContainer } from '../src/ui/view/outline/outlineFit';

describe('outline fit', () => {
  const remPx = 16;
  const threshold = OUTLINE_MIN_CONTAINER_REM * remPx;

  it('opens when the container holds the outline plus a comfortable editing area', () => {
    expect(outlineFitsContainer(threshold, remPx)).toBe(true);
    expect(outlineFitsContainer(960, remPx)).toBe(true);
  });

  it('stays closed in a narrow container', () => {
    expect(outlineFitsContainer(threshold - 1, remPx)).toBe(false);
    expect(outlineFitsContainer(480, remPx)).toBe(false);
  });

  it('scales the threshold with the root font size', () => {
    expect(outlineFitsContainer(threshold, 20)).toBe(false);
  });
});
