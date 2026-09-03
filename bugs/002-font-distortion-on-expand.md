# Bug 002 — Font distortion while expanding

Status: verified. Scope: local client.

## Report

Opening and closing an item visibly distorted the title font. Expansion still needed to reveal details and actions, while reorder movement needed to remain smooth.

## Cause

Full Motion layout animation scaled the complete row while its height changed. Text was rasterized at intermediate scales even though the font styles did not change.

## Contract

- Expansion does not scale or distort title typography.
- The chevron keeps its short rotation.
- Reordered neighbours still move smoothly.
- The domain, copy, colors, and five WebMCP tools remain unchanged.

## Resolution

`Reorder.Item` uses `layout="position"`. Motion animates neighbouring positions without applying a scale transform to the changing row content.

## Evidence

- [Full layout scaling before the fix](assets/002-font-distortion-on-expand/before.mp4)
- [Stable typography after the fix](assets/002-font-distortion-on-expand/after.mp4)

The browser regression checks the title font size before and after expansion, while the Motion E2E test verifies reorder behaviour.
