# Cards

## Purpose

Cards are the primary content container in BerthCare. They group related information and provide clear tap targets for navigation.

## Card Types

### Schedule Card (Today Screen)

**Purpose:** Show a single visit in today's schedule.

Anatomy:

```
┌─────────────────────────────────────┐
│ [Photo] Margaret Chen          [✓]  │ ← Name + status
│         8:00 AM - 9:00 AM           │ ← Time
│         123 Oak St, Edmonton        │ ← Address
└─────────────────────────────────────┘
```

Visual Specs:

- Background: `color.bg.surface` (white)
- Padding: 16pt all sides
- Corner radius: 12pt
- Shadow: 2pt offset, 8pt blur, 10% opacity
- Height: 80pt minimum (expands for long text)
- Margin bottom: 12pt (between cards)

Content:

- **Photo:** 48pt × 48pt circle, left-aligned
- **Name:** `type.title.card` (17pt Semibold), `color.text.default`
- **Time:** `type.body.small` (15pt Regular), `color.text.muted`
- **Address:** `type.body.small` (15pt Regular), `color.text.muted`
- **Status:** Icon + label, right-aligned

Status Indicators:

- **Upcoming:** Gray clock icon, "Upcoming"
- **Current:** Blue dot, "In Progress"
- **Completed:** Green checkmark, "Completed"
- **Unsynced:** Gray cloud, "Not Synced"

Interaction:

- Tap anywhere on card → Navigate to Visit screen
- Press animation: Scale 98%, haptic light
- Transition: 300ms slide right

---

### Visit Summary Card (History)

**Purpose:** Show a past visit in history list.

Anatomy:

```
┌─────────────────────────────────────┐
│ Nov 25, 2025 - 8:00 AM         [✓]  │ ← Date + status
│ Blood pressure: 120/80              │ ← Key fields
│ Wound: 2.5cm, minimal drainage      │
│ [Photo thumbnail]                   │ ← Photos (if any)
└─────────────────────────────────────┘
```

Visual Specs:

- Same as schedule card
- Height: Variable (expands for content)
- Shows up to 3 key fields
- Shows up to 3 photo thumbnails (60pt × 60pt)

Interaction:

- Tap → View full visit details
- Press animation: Scale 98%, haptic light

---

## Token Mapping

| Property            | Token                | Value         |
| ------------------- | -------------------- | ------------- |
| Background          | `color.bg.surface`   | #FFFFFF       |
| Padding             | `space.md`           | 16pt          |
| Corner radius       | Custom               | 12pt          |
| Shadow offset       | Custom               | 2pt           |
| Shadow blur         | Custom               | 8pt           |
| Shadow opacity      | Custom               | 10%           |
| Name typography     | `type.title.card`.   | 17pt Semibold |
| Name color.         | `color.text.default` | #1F2937       |
| Metadata typography | `type.body.small`    | 15pt Regular  |
| Metadata color      | `color.text.muted`.  | #6B7280       |

---

## Accessibility

- **Touch target:** Entire card (minimum 80pt height)
- **Screen reader:** "Margaret Chen, 8:00 AM to 9:00 AM, 123 Oak Street Edmonton, Completed"
- **Focus indicator:** 2pt blue border when focused (keyboard navigation)

---

**Next:** Review `modals.md`, `emergency-trigger.md`, and platform adaptations.
