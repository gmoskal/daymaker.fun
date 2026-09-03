# Bug 001 — Title did not expand the item and blocked drag

Status: verified. Scope: local client.

## Report

The collapsed title had to open its item, inline editing had to appear only after expansion, and drag had to start from the whole unlocked item without a dedicated handle. The pointer needed to communicate `grab` and `grabbing`.

## Cause

`StopItem` rendered `InlineEditor` even while collapsed. A normal title click therefore never dispatched `ToggleStopActions`, and pointer-event isolation on the editor prevented Motion from seeing a gesture started on the title.

## Contract

- Clicking a collapsed title expands exactly that item and reveals inline editing.
- The whole unlocked row remains the Motion reorder surface.
- A locked item can be opened and managed but cannot be dragged.
- The change adds no cards, frames, shadows, gradients, hover color, or drag handle.

## Resolution

The collapsed state renders a plain title button. The expanded state renders the visually identical inline editor with focus. `Reorder.Item` owns the gesture for the complete unlocked row, and CSS exposes `grab` and `grabbing` cursors.

Regression coverage lives in `src/App.test.tsx` and `e2e/sidequest.spec.ts`.

## Evidence

- [Expanded item after the fix](assets/001-title-expand-drag/after.png)

The final compositor check confirmed stable title color, one expanded item, and whole-row drag.
