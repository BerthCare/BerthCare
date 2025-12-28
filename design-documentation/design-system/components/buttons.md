# Buttons

## Purpose

Buttons trigger actions. BerthCare has exactly four button types, each with a clear purpose in the visual hierarchy.

**Design rule:** One primary button per screen. If you think you need two, simplify the screen.

## Button Types

### Primary Button

**Purpose:** The main action on a screen. There can only be one.

Visual:

- Background: `color.brand.primary` (#0066CC)
- Label: `color.text.inverse` (white)
- Typography: `type.button.default` (17pt Semibold)
- Padding: 14pt vertical, 12pt horizontal
- Corner radius: 12pt
- Minimum height: 48pt (exceeds 44pt/48dp requirement)

States:

- **Default:** Solid blue background, white text
- **Pressed:** Scale 95%, haptic medium impact
- **Disabled:** 40% opacity, no interaction
- **Loading:** Spinner replaces label, no interaction

Usage:

- "Complete Visit" (Visit screen)
- "Call Coordinator" (Alert screen)
- One per screen maximum

Code example:

```jsx
<Button
  variant="primary"
  label="Complete Visit"
  onPress={handleComplete}
/>
```

---

### Secondary Button

**Purpose:** Alternative action, less emphasis than primary.

Visual:

- Background: Transparent
- Border: 2pt solid `color.brand.primary`
- Label: `color.brand.primary`
- Typography: `type.button.default` (17pt Semibold)
- Padding: 14pt vertical, 12pt horizontal
- Corner radius: 12pt
- Minimum height: 48pt

States:

- **Default:** Outlined, blue text
- **Pressed:** Background `color.brand.primary` 10% opacity, haptic medium
- **Disabled:** 40% opacity, no interaction

Usage:

- "Cancel" in modals
- "Skip" in onboarding
- Alternative to primary action

Code example:

```jsx
<Button
  variant="secondary"
  label="Cancel"
  onPress={handleCancel}
/>
```

---

### Tertiary Button

**Purpose:** Low-emphasis action, text-only.

Visual:

- Background: Transparent
- Border: None
- Label: `color.brand.primary`
- Typography: `type.button.default` (17pt Semibold)
- Padding: 12pt vertical, 8pt horizontal
- Minimum height: 44pt

States:

- **Default:** Blue text only
- **Pressed:** Background `color.brand.primary` 10% opacity, haptic light
- **Disabled:** 40% opacity, no interaction

Usage:

- "View full history" links
- "Add photo" in visit documentation
- Low-priority actions

Code example:

```jsx
<Button
  variant="tertiary"
  label="View full history"
  onPress={handleViewHistory}
/>
```

---

### Destructive Button

**Purpose:** Dangerous action that requires confirmation.

Visual:

- Background: `color.state.error` (#DC2626)
- Label: `color.text.inverse` (white)
- Typography: `type.button.default` (17pt Semibold)
- Padding: 14pt vertical, 12pt horizontal
- Corner radius: 12pt
- Minimum height: 48pt

States:

- **Default:** Solid red background, white text
- **Pressed:** Scale 95%, haptic heavy impact
- **Disabled:** 40% opacity, no interaction

Usage:

- "Delete Visit" (rare, requires modal confirmation)
- "Sign Out" (settings, Phase 2)
- Always requires confirmation modal

Code example:

```jsx
<Button
  variant="destructive"
  label="Delete Visit"
  onPress={handleDelete}
/>
```

---

## Anatomy

```
┌─────────────────────────────────────┐
│ [12pt padding]                      │
│                                     │
│ [Icon] Label Text                   │ ← 17pt Semibold, centered
│                                     │
│ [12pt padding]                      │
└─────────────────────────────────────┘
  ↑ 14pt vertical padding (top/bottom)
  ↑ 12pt horizontal padding (left/right)
  ↑ 12pt corner radius
  ↑ Minimum 48pt height
```

With icon:

- Icon: 20pt × 20pt (SF Symbol or Material Icon)
- Gap between icon and label: 8pt (`space.sm`)
- Icon color matches label color

---

## Token Mapping

### Primary Button Tokens

| Property           | Token                        | Value           |
| ------------------ | ---------------------------- | --------------- |
| Background         | `color.brand.primary`        | #0066CC         |
| Label color        | `color.text.inverse`         | #FFFFFF         |
| Font family        | `type.font.system`           | SF Pro / Roboto |
| Font size          | `type.button.default.size`   | 17pt            |
| Font weight        | `type.button.default.weight` | Semibold (600)  |
| Padding vertical   | Custom                       | 14pt            |
| Padding horizontal | `space.md`                   | 16pt            |
| Corner radius      | Custom                       | 12pt            |
| Press animation    | `motion.fast`                | 150ms           |

### Secondary Button Tokens

| Property         | Token                 | Value             |
| ---------------- | --------------------- | ----------------- |
| Background       | Transparent           | N/A               |
| Border           | `color.brand.primary` | 2pt solid #0066CC |
| Label color      | `color.brand.primary` | #0066CC           |
| Other properties | Same as primary       | —                 |

### Tertiary Button Tokens

| Property           | Token                 | Value   |
| ------------------ | --------------------- | ------- |
| Background         | Transparent           | N/A     |
| Border             | None                  | N/A     |
| Label color        | `color.brand.primary` | #0066CC |
| Padding vertical   | Custom                | 12pt    |
| Padding horizontal | `space.sm`            | 8pt     |

### Destructive Button Tokens

| Property         | Token                | Value   |
| ---------------- | -------------------- | ------- |
| Background       | `color.state.error`  | #DC2626 |
| Label color      | `color.text.inverse` | #FFFFFF |
| Other properties | Same as primary      | —       |

---

## Behavior

### Press Animation

Standard (motion enabled):

1. User presses button
2. Button scales to 95% (150ms, ease-out)
3. Haptic feedback (medium impact)
4. User releases button
5. Button scales back to 100% (150ms, ease-out)
6. Action executes

Reduced motion:

1. User presses button
2. Button opacity changes to 80% (instant)
3. Haptic feedback (medium impact)
4. User releases button
5. Button opacity back to 100% (instant)
6. Action executes

Code example:

```javascript
const scale = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.timing(scale, {
    toValue: 0.95,
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    useNativeDriver: true,
  }).start();
  HapticFeedback.trigger('impactMedium');
};

const handlePressOut = () => {
  Animated.timing(scale, {
    toValue: 1,
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    useNativeDriver: true,
  }).start();
};
```

### Loading State

When button is loading:

- Label is hidden
- Spinner appears (20pt × 20pt)
- Spinner color matches label color
- Button is not interactive (disabled)
- No haptic feedback

Code example:

```jsx
<Button
  variant="primary"
  label="Complete Visit"
  loading={isSyncing}
  onPress={handleComplete}
/>
```

### Disabled State

When button is disabled:

- Opacity: 40%
- No interaction (onPress ignored)
- No haptic feedback
- Cursor: not-allowed (web)

---

## Accessibility

### Touch Targets

All buttons meet minimum touch target requirements:

- iOS: ≥44pt × 44pt
- Android: ≥48dp × 48dp

How achieved:

- Primary/Secondary/Destructive: 48pt height (exceeds minimum)
- Tertiary: 44pt height (meets minimum)

### Screen Reader Labels

Buttons have clear, action-oriented labels:

- **Good:** "Complete Visit", "Call Coordinator", "Cancel"
- **Bad:** "OK", "Submit", "Click Here"

Code example:

```jsx
<Button
  variant="primary"
  label="Complete Visit"
  accessibilityLabel="Complete visit and return to schedule"
  accessibilityHint="Saves documentation and marks visit as complete"
/>
```

### Color Contrast

All button labels meet WCAG 2.1 AA contrast requirements:

| Button Type | Background  | Label   | Contrast | WCAG |
| ----------- | ----------- | ------- | -------- | ---- |
| Primary     | #0066CC     | #FFFFFF | 4.52:1   | AA ✓ |
| Secondary   | Transparent | #0066CC | 4.52:1   | AA ✓ |
| Tertiary    | Transparent | #0066CC | 4.52:1   | AA ✓ |
| Destructive | #DC2626     | #FFFFFF | 5.54:1   | AA ✓ |

### Dynamic Type

Button labels scale with system font settings:

- At 100%: 17pt
- At 150%: 25.5pt
- At 200%: 34pt

Button height expands to accommodate larger text:

- At 100%: 48pt
- At 200%: 68pt (minimum)

---

## Platform Adaptations

### iOS

- **Haptics:** Medium impact for primary/secondary, light for tertiary
- **Icons:** SF Symbols (e.g., `checkmark.circle.fill`)
- **Corner radius:** 12pt (iOS style)

### Android

- **Haptics:** Click vibration (10ms)
- **Icons:** Material Icons (e.g., `check_circle`)
- **Corner radius:** 12pt (slightly more rounded than Material default)
- **Ripple effect:** Optional, can add Material ripple on press

---

## Usage Guidelines

### When to Use Primary Button

Use for:

- The single most important action on a screen
- Actions that complete a workflow ("Complete Visit")
- Actions that move forward ("Next", "Continue")

Don't use for:

- Multiple actions on the same screen (only one primary)
- Destructive actions (use destructive button)
- Low-priority actions (use secondary or tertiary)

### When to Use Secondary Button

Use for:

- Alternative to primary action ("Cancel", "Skip")
- Less important but still significant actions
- Actions that don't complete the workflow

Don't use for:

- The main action (use primary)
- Very low-priority actions (use tertiary)

### When to Use Tertiary Button

Use for:

- Low-priority actions ("View full history")
- Inline actions within content
- Actions that open additional information

Don't use for:

- Primary actions (use primary button)
- Actions that need emphasis (use secondary)

### When to Use Destructive Button

Use for:

- Dangerous actions that can't be undone ("Delete Visit")
- Actions that remove data
- Always with confirmation modal

Don't use for:

- Canceling actions (use secondary)
- Non-destructive actions (use primary)

---

## Examples

### Visit Screen (Primary Button)

```
┌─────────────────────────────────────┐
│ Visit Details                       │
│                                     │
│ [Documentation fields...]           │
│                                     │
│ [24pt space]                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Complete Visit              │ │ ← Primary button
│ └─────────────────────────────────┘ │
│ [16pt space]                        │
└─────────────────────────────────────┘
```

### Modal (Secondary + Destructive)

```
┌─────────────────────────────────────┐
│ Delete Visit?                       │
│                                     │
│ This action cannot be undone.       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Delete Visit                │ │ ← Destructive button
│ └─────────────────────────────────┘ │
│ [12pt space]                        │
│ ┌─────────────────────────────────┐ │
│ │     Cancel                      │ │ ← Secondary button
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Inline Action (Tertiary Button)

```
┌─────────────────────────────────────┐
│ Visit History                       │
│                                     │
│ Nov 25, 2025 - 8:00 AM              │
│ Blood pressure: 120/80              │
│                                     │
│ Nov 24, 2025 - 8:00 AM              │
│ Blood pressure: 118/78              │
│                                     │
│ View full history →                 │ ← Tertiary button
└─────────────────────────────────────┘
```

---

## Do's and Don'ts

### Do:

- Use one primary button per screen
- Place primary button in thumb zone (bottom third)
- Use clear, action-oriented labels
- Provide haptic feedback on press
- Support reduced motion

### Don't:

- Use multiple primary buttons on one screen
- Use vague labels ("OK", "Submit")
- Make buttons smaller than 44pt/48dp
- Ignore disabled state (make it obvious)
- Use destructive button without confirmation

---

**Next:** Review `forms.md` for input field specifications.
