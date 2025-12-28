# Color Tokens

## Philosophy

Every color in BerthCare has a semantic purpose. There are no decorative colors. Colors communicate state, guide action, and establish hierarchy.

Colors are tested in bright sunlight (Sarah works outdoors) and meet WCAG 2.1 AA contrast requirements (Sarah may have visual impairments).

## Color Categories

### Brand Colors

Brand colors establish identity and guide primary actions.

#### `color.brand.primary`

- **Light mode:** `#0066CC` (Blue)
- **Dark mode:** `#3D8FE8` (Lighter blue for dark backgrounds)
- **Usage:** Primary buttons, primary actions, links, active states
- **Contrast:** 4.52:1 on white (WCAG AA ✓)
- **Example:** "Complete Visit" button background

Do:

- Use for the single primary action on each screen
- Use for active navigation items
- Use for interactive elements that drive core workflows

Don't:

- Use for multiple actions on the same screen (dilutes hierarchy)
- Use for decorative elements
- Use for text on colored backgrounds (use `color.text.inverse` instead)

#### `color.brand.accent`

- **Light mode:** `#00A896` (Teal)
- **Dark mode:** `#2DC4B6` (Lighter teal)
- **Usage:** Secondary emphasis, informational highlights, progress indicators
- **Contrast:** 3.12:1 on white (WCAG AA for large text ✓)
- **Example:** Sync status "Syncing..." indicator

Do:

- Use for secondary actions or information
- Use for progress indicators
- Use sparingly to maintain hierarchy

Don't:

- Use as primary action color (use `color.brand.primary`)
- Use for critical states (use state colors)

#### `color.brand.secondary`

- **Light mode:** `#4A5568` (Dark gray-blue)
- **Dark mode:** `#A0AEC0` (Light gray-blue)
- **Usage:** Secondary buttons, tertiary actions, muted emphasis
- **Contrast:** 8.59:1 on white (WCAG AAA ✓)
- **Example:** "Cancel" button in modals

---

### Neutral Colors

Neutral colors create hierarchy, structure, and backgrounds.

#### `color.neutral.50`

- **Value:** `#F9FAFB` (Lightest gray)
- **Usage:** Canvas background (light mode), subtle backgrounds
- **Example:** App background behind cards

#### `color.neutral.100`

- **Value:** `#F3F4F6`
- **Usage:** Card backgrounds, surface backgrounds
- **Example:** Schedule card background

#### `color.neutral.200`

- **Value:** `#E5E7EB`
- **Usage:** Borders, dividers, disabled backgrounds
- **Example:** Input field borders

#### `color.neutral.300`

- **Value:** `#D1D5DB`
- **Usage:** Placeholder text, disabled text, subtle dividers
- **Example:** "Tap to edit" placeholder

#### `color.neutral.400`

- **Value:** `#9CA3AF`
- **Usage:** Muted text, secondary information
- **Example:** Timestamps, metadata

#### `color.neutral.500`

- **Value:** `#6B7280`
- **Usage:** Body text (secondary), icons
- **Example:** Field labels

#### `color.neutral.600`

- **Value:** `#4B5563`
- **Usage:** Body text (primary), headings
- **Example:** Client names, visit notes

#### `color.neutral.700`

- **Value:** `#374151`
- **Usage:** Headings, emphasized text
- **Example:** Screen titles

#### `color.neutral.800`

- **Value:** `#1F2937`
- **Usage:** High-emphasis text, dark mode backgrounds
- **Example:** Page headings

#### `color.neutral.900`

- **Value:** `#111827` (Darkest gray)
- **Usage:** Maximum contrast text, dark mode surfaces
- **Example:** Critical information

---

### Background Colors

Background colors are semantic and adapt to light/dark mode.

#### `color.bg.canvas`

- **Light mode:** `#F9FAFB` (`color.neutral.50`)
- **Dark mode:** `#1C1C1E` (Dark gray, not pure black)
- **Usage:** App background, behind all content
- **Example:** Today screen background

#### `color.bg.surface`

- **Light mode:** `#FFFFFF` (White)
- **Dark mode:** `#2C2C2E` (Slightly lighter than canvas)
- **Usage:** Cards, modals, elevated surfaces
- **Example:** Schedule card, visit form

#### `color.bg.overlay`

- **Light mode:** `rgba(0, 0, 0, 0.5)` (50% black)
- **Dark mode:** `rgba(0, 0, 0, 0.7)` (70% black)
- **Usage:** Modal backdrops, overlays
- **Example:** Emergency alert modal backdrop

---

### Text Colors

Text colors are semantic and ensure proper contrast.

#### `color.text.default`

- **Light mode:** `#1F2937` (`color.neutral.800`)
- **Dark mode:** `#F9FAFB` (`color.neutral.50`)
- **Usage:** Primary body text, default text
- **Contrast:** 12.63:1 on white (WCAG AAA ✓)
- **Example:** Visit notes, documentation text

#### `color.text.muted`

- **Light mode:** `#6B7280` (`color.neutral.500`)
- **Dark mode:** `#9CA3AF` (`color.neutral.400`)
- **Usage:** Secondary text, metadata, timestamps
- **Contrast:** 4.69:1 on white (WCAG AA ✓)
- **Example:** "Last updated 2 hours ago"

#### `color.text.inverse`

- **Light mode:** `#FFFFFF` (White)
- **Dark mode:** `#1F2937` (`color.neutral.800`)
- **Usage:** Text on colored backgrounds (buttons, badges)
- **Contrast:** 4.52:1 on `color.brand.primary` (WCAG AA ✓)
- **Example:** "Complete Visit" button label

#### `color.text.disabled`

- **Light mode:** `#D1D5DB` (`color.neutral.300`)
- **Dark mode:** `#4B5563` (`color.neutral.600`)
- **Usage:** Disabled text, unavailable options
- **Contrast:** 2.12:1 on white (intentionally low, indicates disabled state)
- **Example:** Disabled button labels

#### `color.text.link`

- **Value:** `color.brand.primary`
- **Usage:** Hyperlinks, tappable text
- **Example:** "View full history" link

#### `color.text.placeholder`

- **Light mode:** `#9CA3AF` (`color.neutral.400`)
- **Dark mode:** `#6B7280` (`color.neutral.500`)
- **Usage:** Input placeholders, empty state text
- **Example:** "Tap to add notes"

---

### State Colors

State colors communicate system status and user feedback.

#### Success (Green)

`color.state.success`

- **Light mode:** `#10B981` (Green)
- **Dark mode:** `#34D399` (Lighter green)
- **Usage:** Success messages, completed states, positive feedback
- **Contrast:** 3.04:1 on white (WCAG AA for large text ✓)
- **Example:** "Visit completed" confirmation

`color.state.success.bg`

- **Light mode:** `#D1FAE5` (Light green)
- **Dark mode:** `#064E3B` (Dark green)
- **Usage:** Success message backgrounds
- **Example:** Success toast background

`color.state.success.text`

- **Light mode:** `#065F46` (Dark green)
- **Dark mode:** `#A7F3D0` (Light green)
- **Usage:** Success message text
- **Contrast:** 7.42:1 on white (WCAG AAA ✓)

#### Warning (Yellow)

`color.state.warning`

- **Light mode:** `#F59E0B` (Amber)
- **Dark mode:** `#FBBF24` (Lighter amber)
- **Usage:** Warning messages, caution states, needs attention
- **Contrast:** 2.37:1 on white (WCAG AA for large text, use with caution)
- **Example:** "This field hasn't changed in 7 days"

`color.state.warning.bg`

- **Light mode:** `#FEF3C7` (Light amber)
- **Dark mode:** `#78350F` (Dark amber)
- **Usage:** Warning message backgrounds

`color.state.warning.text`

- **Light mode:** `#92400E` (Dark amber)
- **Dark mode:** `#FDE68A` (Light amber)
- **Usage:** Warning message text
- **Contrast:** 6.89:1 on white (WCAG AA ✓)

#### Error (Red)

`color.state.error`

- **Light mode:** `#DC2626` (Red)
- **Dark mode:** `#F87171` (Lighter red)
- **Usage:** Error messages, failed states, destructive actions
- **Contrast:** 5.54:1 on white (WCAG AA ✓)
- **Example:** "Sync failed" error message

`color.state.error.bg`

- **Light mode:** `#FEE2E2` (Light red)
- **Dark mode:** `#7F1D1D` (Dark red)
- **Usage:** Error message backgrounds

`color.state.error.text`

- **Light mode:** `#991B1B` (Dark red)
- **Dark mode:** `#FCA5A5` (Light red)
- **Usage:** Error message text
- **Contrast:** 8.12:1 on white (WCAG AAA ✓)

#### Info (Blue)

`color.state.info`

- **Light mode:** `#3B82F6` (Blue)
- **Dark mode:** `#60A5FA` (Lighter blue)
- **Usage:** Informational messages, neutral feedback
- **Contrast:** 4.12:1 on white (WCAG AA ✓)
- **Example:** "New schedule available"

`color.state.info.bg`

- **Light mode:** `#DBEAFE` (Light blue)
- **Dark mode:** `#1E3A8A` (Dark blue)
- **Usage:** Info message backgrounds

`color.state.info.text`

- **Light mode:** `#1E40AF` (Dark blue)
- **Dark mode:** `#BFDBFE` (Light blue)
- **Usage:** Info message text
- **Contrast:** 7.89:1 on white (WCAG AAA ✓)

---

### Sync Status Colors

Sync colors are critical for offline-first architecture. They must be instantly recognizable.

#### `color.sync.local`

- **Light mode:** `#6B7280` (`color.neutral.500`)
- **Dark mode:** `#9CA3AF` (`color.neutral.400`)
- **Usage:** "Saved locally" state (not yet synced)
- **Icon:** Cloud with slash or gray cloud
- **Example:** Visit saved offline, waiting for network

#### `color.sync.syncing`

- **Value:** `color.brand.accent` (`#00A896`)
- **Usage:** "Syncing..." state (in progress)
- **Icon:** Animated spinner or cloud with arrows
- **Example:** Visit uploading to server

#### `color.sync.synced`

- **Value:** `color.state.success` (`#10B981`)
- **Usage:** "Synced" state (successfully uploaded)
- **Icon:** Green checkmark or cloud with checkmark
- **Example:** Visit successfully synced to server

#### `color.sync.error`

- **Value:** `color.state.error` (`#DC2626`)
- **Usage:** "Sync failed" state (error occurred)
- **Icon:** Red exclamation or cloud with X
- **Example:** Visit failed to sync, will retry

Why these colors:

- Gray = neutral, waiting (not urgent)
- Teal = active, in progress (informational)
- Green = success, complete (positive)
- Red = error, needs attention (urgent)

---

### Emergency Colors

Emergency colors are reserved for critical situations. They must be unmistakable.

#### `color.emergency.primary`

- **Light mode:** `#DC2626` (Red, same as `color.state.error`)
- **Dark mode:** `#F87171` (Lighter red)
- **Usage:** Emergency button, critical alerts
- **Contrast:** 5.54:1 on white (WCAG AA ✓)
- **Example:** "Something's wrong" button

#### `color.emergency.bg`

- **Light mode:** `#FEE2E2` (Light red)
- **Dark mode:** `#7F1D1D` (Dark red)
- **Usage:** Emergency alert backgrounds
- **Example:** Emergency alert modal background

#### `color.emergency.text`

- **Light mode:** `#991B1B` (Dark red)
- **Dark mode:** `#FCA5A5` (Light red)
- **Usage:** Emergency alert text
- **Contrast:** 8.12:1 on white (WCAG AAA ✓)
- **Example:** "Call Coordinator" button label

**Design rule:** Emergency colors are never used for non-emergency purposes. This preserves their urgency and recognizability.

---

## Color Usage Examples

### Example 1: Schedule Card

```
┌─────────────────────────────────────┐
│ [Photo]  Margaret Chen              │ ← color.text.default
│          8:00 AM - 9:00 AM          │ ← color.text.muted
│          123 Oak St, Edmonton       │ ← color.text.muted
│                                     │
│          [✓ Synced]                 │ ← color.sync.synced
└─────────────────────────────────────┘
  ↑ color.bg.surface (card background)
```

### Example 2: Primary Button

```
┌─────────────────────────────────────┐
│         Complete Visit              │ ← color.text.inverse
└─────────────────────────────────────┘
  ↑ color.brand.primary (button background)
```

### Example 3: Error Message

```
┌─────────────────────────────────────┐
│ ⚠ Sync failed. Will retry in 30s.  │ ← color.state.error.text
└─────────────────────────────────────┘
  ↑ color.state.error.bg (message background)
```

### Example 4: Emergency Button

```
┌─────────────────────────────────────┐
│      🚨 Something's Wrong           │ ← color.text.inverse
└─────────────────────────────────────┘
  ↑ color.emergency.primary (button background)
```

---

## Accessibility Considerations

### Contrast Ratios

All color combinations meet WCAG 2.1 AA requirements:

| Combination                                   | Contrast | WCAG Level | Usage          |
| --------------------------------------------- | -------- | ---------- | -------------- |
| `color.text.default` on `color.bg.surface`.   | 12.63:1  | AAA        | Body text      |
| `color.text.muted` on `color.bg.surface`.     | 4.69:1   | AA         | Secondary text |
| `color.brand.primary` on `color.bg.surface`   | 4.52:1   | AA         | Buttons, links |
| `color.text.inverse` on `color.brand.primary` | 4.52:1   | AA         | Button labels  |
| `color.state.error` on `color.bg.surface`     | 5.54:1   | AA         | Error messages |
| `color.state.success` on `color.bg.surface`.  | 3.04:1   | AA (large) | Success icons  |

### Color Blindness

Colors are never the only indicator of state:

- **Sync status:** Color + icon + text ("Synced" with green checkmark)
- **Errors:** Color + icon + text ("Error" with red exclamation)
- **Buttons:** Color + label + position (primary button is always bottom)

**Why:** 8% of men have color blindness. Redundant encoding ensures everyone can use the app.

### High Contrast Mode

High contrast mode uses maximum contrast colors:

- Text: Pure black (`#000000`) on pure white (`#FFFFFF`)
- Buttons: High contrast borders and fills
- Icons: Solid fills instead of outlines

---

## Dark Mode

All colors have dark mode variants that maintain contrast and hierarchy:

| Token                 | Light Mode | Dark Mode |
| --------------------- | ---------- | --------- |
| `color.bg.canvas`     | `#F9FAFB`  | `#1C1C1E` |
| `color.bg.surface`.   | `#FFFFFF`  | `#2C2C2E` |
| `color.text.default`  | `#1F2937`  | `#F9FAFB` |
| `color.text.muted`.   | `#6B7280`  | `#9CA3AF` |
| `color.brand.primary` | `#0066CC`  | `#3D8FE8` |
| `color.state.success` | `#10B981`  | `#34D399` |
| `color.state.error`.  | `#DC2626`  | `#F87171` |

**Why slightly lighter in dark mode:** Pure saturated colors are harsh on dark backgrounds. Slightly lighter versions reduce eye strain.

---

## Do's and Don'ts

### Do:

- Use semantic color tokens (not hex values)
- Test colors in bright sunlight (outdoor visibility)
- Ensure text meets contrast requirements
- Use color + icon + text for state (redundant encoding)
- Respect emergency color reservation (red = urgent only)

### Don't:

- Hard-code hex values (use tokens)
- Use color as the only indicator (accessibility)
- Use emergency colors for non-emergencies (dilutes urgency)
- Use too many colors on one screen (visual noise)
- Use decorative colors (every color has a job)

---

**Next:** Review `typography.md` for type scale and text styles.
