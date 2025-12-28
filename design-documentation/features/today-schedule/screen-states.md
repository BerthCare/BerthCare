# Today Schedule: Screen States

## Default State (Has Visits)

**When:** Sarah has visits scheduled for today

Layout:

```
┌─────────────────────────────────────┐
│ < Back    [Synced ✓]           ⚠    │ ← Navigation bar
├─────────────────────────────────────┤
│ [8pt padding]                       │
│ Today                               │ ← Page heading (28pt Bold)
│ [16pt space]                        │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] Margaret Chen      [✓]  │ │ ← Schedule card
│ │         8:00 AM - 9:00 AM       │ │
│ │         123 Oak St, Edmonton    │ │
│ └─────────────────────────────────┘ │
│ [12pt space]                        │
│ ┌─────────────────────────────────┐ │
│ │ [Photo] John Smith         [○]  │ │ ← Schedule card
│ │         10:00 AM - 11:00 AM     │ │
│ │         456 Maple Ave, Edmonton │ │
│ └─────────────────────────────────┘ │
│ [12pt space]                        │
│ [More cards...]                     │
│ [16pt bottom padding]               │
└─────────────────────────────────────┘
```

Components:

- Navigation bar with sync indicator and emergency button
- Page heading: "Today"
- List of schedule cards (6-8 typical)
- Pull-to-refresh (hidden until pulled)

---

## Loading State (First Launch)

**When:** App is loading schedule for the first time

Layout:

```
┌─────────────────────────────────────┐
│         [Syncing...]           ⚠    │ ← Navigation bar
├─────────────────────────────────────┤
│ [8pt padding]                       │
│ Today                               │
│ [16pt space]                        │
│                                     │
│         [Spinner]                   │ ← Loading spinner
│         Loading schedule...         │ ← 15pt Regular, gray
│                                     │
└─────────────────────────────────────┘
```

**Duration:** <1 second (cached data loads instantly after first launch)

Components:

- Spinner (20pt × 20pt, blue)
- Loading message

---

## Empty State (No Visits Today)

**When:** Sarah has no visits scheduled for today

Layout:

```
┌─────────────────────────────────────┐
│         [Synced ✓]             ⚠    │
├─────────────────────────────────────┤
│ [8pt padding]                       │
│ Today                               │
│ [32pt space]                        │
│                                     │
│         [Calendar icon]             │ ← 64pt × 64pt, gray
│         No visits today             │ ← 22pt Semibold
│         Enjoy your day off!         │ ← 17pt Regular, gray
│                                     │
└─────────────────────────────────────┘
```

Components:

- Empty state illustration (calendar icon)
- Empty state message
- No action required (just informational)

---

## Offline State (No Network, Cached Data)

**When:** Sarah has no internet, but schedule is cached

Layout:

- Same as default state
- Sync indicator shows "Saved locally" (gray cloud)
- All functionality works normally
- Background sync attempts every 30 seconds

Visual difference:

- Sync indicator: Gray cloud + "Saved locally"
- Subtle banner (optional): "Working offline" (dismissible)

---

## Error State (Sync Failed)

**When:** Sync has failed multiple times

Layout:

```
┌─────────────────────────────────────┐
│      [Sync failed ⚠]           ⚠    │ ← Red sync indicator
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ⚠ Sync failed. Will retry in    │ │ ← Error banner
│ │   30 seconds. Tap to retry now. │ │
│ └─────────────────────────────────┘ │
│ [8pt space]                         │
│ Today                               │
│ [16pt space]                        │
│ [Schedule cards...]                 │ ← Cards show normally
└─────────────────────────────────────┘
```

Components:

- Error banner (dismissible)
- Red sync indicator
- Retry button (in banner)
- Schedule cards (still visible, using cached data)

Behavior:

- Auto-retry every 30 seconds (exponential backoff)
- Manual retry on tap
- Error banner dismisses after successful sync

---

## Pull-to-Refresh State

**When:** Sarah pulls down to refresh schedule

Layout:

```
┌─────────────────────────────────────┐
│         [Syncing...]           ⚠    │
├─────────────────────────────────────┤
│         [Spinner]                   │ ← Pull-to-refresh spinner
│ [8pt padding]                       │
│ Today                               │
│ [Schedule cards...]                 │
└─────────────────────────────────────┘
```

Behavior:

1. User pulls down from top
2. Spinner appears (blue, rotating)
3. Background sync triggers
4. Spinner disappears after sync completes (<2 seconds)
5. Schedule updates if changes detected

---

## Visit Completed State

**When:** Sarah just completed a visit and returned to Today

Layout:

- Same as default state
- Completed visit card shows green checkmark
- Sync indicator shows "Syncing..." then "Synced"
- Optional: Brief toast "Visit completed" (3 seconds, auto-dismiss)

Animation:

- Visit screen slides out (300ms)
- Today screen slides in (300ms)
- Completed card updates (checkmark fades in, 150ms)

---

## Dark Mode State

**When:** System is in dark mode

Visual changes:

- Background: `color.bg.canvas` (dark gray, not pure black)
- Cards: `color.bg.surface` (slightly lighter gray)
- Text: `color.text.default` (off-white)
- All other elements adapt via semantic color tokens

**Layout:** Identical to light mode

---

## Dynamic Type State (200% Scale)

**When:** User has set text size to maximum (200%)

Visual changes:

- Page heading: 56pt (from 28pt)
- Card title: 34pt (from 17pt)
- Card metadata: 30pt (from 15pt)
- Card height: 120pt (from 80pt, expands for larger text)
- Vertical spacing: Slightly increased

**Layout:** Adapts to larger text, no horizontal scrolling

---

## Accessibility Focus State

**When:** User is navigating with VoiceOver/TalkBack

Visual changes:

- Focused card has 2pt blue border
- Screen reader announces: "Margaret Chen, 8:00 AM to 9:00 AM, 123 Oak Street Edmonton, Completed. Button."

Behavior:

- Swipe right: Next card
- Swipe left: Previous card
- Double-tap: Open visit

---

**Next:** Review `interactions.md` for detailed interaction patterns.
