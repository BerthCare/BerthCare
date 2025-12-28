# Today Schedule Feature

## Overview

The Today screen is the heart of BerthCare. It's the first thing Sarah sees when she opens the app, and it's where she spends most of her time.

**Purpose:** Show today's visits in a scannable list. Let Sarah start her next visit in one tap.

Success criteria:

- Sarah can find her next visit in <3 seconds
- Tapping a client opens the visit screen in <300ms
- Schedule updates automatically when online
- Works perfectly offline (cached for 30 days)

## Key Principles

1. **App always opens to Today** – No splash screens, no decisions
2. **One tap to start visit** – Tap client card → Visit screen
3. **Scannable at a glance** – Photos, names, times, addresses visible
4. **Offline always works** – 30 days of cached schedule
5. **Passive EVV** – Visit receipts happen automatically, no check-in/check-out

## Components Used

- Schedule cards (`cards.md`)
- Sync status indicator (`navigation.md`)
- Emergency button (`emergency-trigger.md`)
- Empty state (no visits today)

## Related Files

- `user-journey.md` – Sarah's journey through the Today screen
- `screen-states.md` – All possible screen states
- `interactions.md` – Tap, pull-to-refresh, swipe gestures
- `accessibility.md` – Screen reader, dynamic type, touch targets
- `implementation.md` – Developer handoff notes

---

**Next:** Review `user-journey.md` for detailed user flow.
