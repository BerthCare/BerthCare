# Modals

## Purpose

Modals interrupt the user. Use them rarely—only for critical confirmations or emergencies.

**Design rule:** If it can be inline, it should be inline. Modals are a last resort.

## When to Use Modals

Use for:

- Destructive confirmations ("Delete Visit?")
- Emergency alerts ("Something's Wrong")
- Critical errors that block workflow

Don't use for:

- Information that can be inline
- Non-critical messages
- Multi-step workflows

## Modal Anatomy

```
[50% black backdrop]

┌─────────────────────────────────────┐
│ Modal Title                         │ ← 22pt Semibold
│                                     │
│ Modal body text explains the        │ ← 17pt Regular
│ situation and consequences.         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Primary Action              │ │ ← Primary or Destructive
│ └─────────────────────────────────┘ │
│ [12pt space]                        │
│ ┌─────────────────────────────────┐ │
│ │     Cancel                      │ │ ← Secondary
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Visual Specs:

- Background: `color.bg.surface` (white)
- Padding: 24pt all sides
- Corner radius: 16pt
- Max width: 320pt (centered)
- Backdrop: 50% black, tappable to dismiss (non-destructive modals only)

Animation:

- Backdrop fades in (300ms)
- Modal slides up from bottom (iOS) or scales in (Android)
- Duration: 300ms, `motion.ease.decelerate`

## Modal Types

### Confirmation Modal

**Purpose:** Confirm destructive action.

**Example:** "Delete Visit?"

Content:

- Title: Action being confirmed
- Body: Consequences ("This cannot be undone")
- Primary button: Destructive action ("Delete Visit")
- Secondary button: Cancel

Behavior:

- Backdrop tap → Dismiss (cancel)
- Cancel button → Dismiss
- Destructive button → Execute action, dismiss
- Escape key → Dismiss (web)

### Alert Modal (Emergency)

**Purpose:** Emergency alert screen.

Content:

- Title: "Something's Wrong"
- Body: Brief context
- Primary button: "Call Coordinator"
- No cancel button (can swipe down to dismiss)

Behavior:

- Backdrop tap → Dismiss
- Swipe down → Dismiss
- Call button → Open phone dialer

---

## Accessibility

- **Focus trap:** Focus stays within modal
- **Escape key:** Dismisses modal (web)
- **Screen reader:** Announces modal title on open
- **Focus management:** Focus moves to first button on open

---

**Next:** Review `emergency-trigger.md` for emergency button specification.
