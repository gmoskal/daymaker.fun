# Bug 003 — Timeline axis collided with content

Status: verified. Scope: local client.

## Report

The timeline line overlapped times and statuses, the layout did not match the editorial reference, and drag had regressed. Item actions also needed one shared horizontal tray rather than unrelated text buttons.

## Cause

Each row rendered its own line in the same column as status content. The correct geometry belongs to the complete list: one axis between a right-aligned time column and the content column.

## Contract

- One thin dotted axis runs from the first to the last schedule item.
- Times sit immediately to the left; titles, statuses, chevrons, and details stay to the right.
- Active state uses red only for time and status.
- The layout contains no cards, decorative frames, shadows, gradients, or horizontal overflow at 390 px.
- One frameless action icon reveals a horizontal tray whose open state is shared when another item is selected.
- Whole-item Motion drag and inline editing continue to work.

## Resolution

The axis moved to `.stop-list::before`. Explicit time and content columns keep text clear of the line. The action mode moved to shared React view state, while each selected item renders the same neutral icon tray.

## Evidence

- [Overlapping timeline before the fix](assets/003-timeline-axis-layout/before.png)
- [Desktop after the fix](assets/003-timeline-axis-layout/after-desktop.png)
- [Mobile after the fix](assets/003-timeline-axis-layout/after-mobile.png)

Automated browser checks cover geometry, neutral action color, shared action state, drag, and mobile overflow.
