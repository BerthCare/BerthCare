# Components

## What Components Are

Components are reusable UI building blocks built from design tokens. They are the vocabulary of the BerthCare interface.

This is not a comprehensive component library with dozens of variants. This is a **ruthlessly minimal** set of components designed for three screens: Today, Visit, Alert.

## Component Philosophy

### 1. Say No to Variants

Most design systems fail by offering too many options. BerthCare offers exactly what's needed:

- **Buttons:** 4 types (primary, secondary, tertiary, destructive)
- **Cards:** 2 types (schedule, visit summary)
- **Forms:** 3 input types (text, multiline, numeric)
- **Modals:** 1 pattern (rare, only for critical confirmations)

If you think you need a new variant, first prove that existing components can't solve the problem.

### 2. Built from Tokens

Every component is built from design tokens:

- Colors: `color.brand.primary`, `color.text.default`
- Typography: `type.button.default`, `type.body.default`
- Spacing: `space.md`, `space.lg`
- Motion: `motion.fast`, `motion.default`

This ensures consistency and makes changes propagate cleanly.

### 3. Accessibility Built In

Every component meets WCAG 2.1 AA standards:

- Minimum touch targets (44pt/48dp)
- Color contrast (4.5:1 for text)
- Screen reader support (semantic labels)
- Dynamic type support (text scales)

Accessibility is not optional. It's part of the component specification.

### 4. Platform-Aware

Components respect platform conventions:

- iOS: SF Symbols, haptics, swipe gestures
- Android: Material icons, vibration, back button
- Shared: Same behavior, same visual hierarchy

The experience should feel native but recognizable as BerthCare.

## Component List

### Core Components

`buttons.md`

- Primary button (main action)
- Secondary button (alternative action)
- Tertiary button (low-emphasis action)
- Destructive button (dangerous action)

`forms.md`

- Text input (single-line)
- Multiline input (notes, documentation)
- Numeric input (vitals, measurements)
- Tap-to-edit rows (copy-and-edit pattern)

`navigation.md`

- App shell (no hamburger menu)
- Back button (iOS swipe, Android system)
- Status bar (sync indicator, time)

`cards.md`

- Schedule card (Today screen)
- Visit summary card (history)

`modals.md`

- Confirmation modal (rare, only for destructive actions)
- Alert modal (emergency screen)

`emergency-trigger.md`

- Emergency button (always accessible)
- Call coordinator pattern

## Component Specifications

Each component file includes:

### 1. Purpose

What the component does and why it exists.

### 2. Anatomy

Visual breakdown of component parts (container, label, icon, etc.).

### 3. Variants

All supported variants (primary, secondary, etc.).

### 4. States

All possible states (default, pressed, disabled, loading, error).

### 5. Tokens

Exact token mapping for colors, typography, spacing, motion.

### 6. Behavior

Interaction patterns, animations, haptic feedback.

### 7. Accessibility

Screen reader labels, touch targets, contrast ratios.

### 8. Platform Adaptations

iOS vs Android differences.

### 9. Usage Examples

When to use, when not to use, code examples.

## Design Rules (Hard Constraints)

### Rule 1: One Primary Button Per Screen

Every screen has exactly one primary action. If you think you need two, you're wrong. Simplify the screen or split it into two screens.

Example:

- Today screen: Tap client card (implicit primary action)
- Visit screen: Complete visit (explicit primary action)
- Alert screen: Call coordinator (explicit primary action)

### Rule 2: Touch Targets ≥44pt (iOS) / 48dp (Android)

All interactive elements meet minimum touch target sizes. No exceptions.

How to achieve:

- Buttons: 44pt/48dp minimum height
- Icons: 24pt visual size + 10pt padding = 44pt touch target
- Text links: 12pt vertical padding = 44pt touch target

### Rule 3: Consistent Visual Hierarchy

Components follow a strict hierarchy:

- Primary button: Filled, brand color, high contrast
- Secondary button: Outlined, brand color border
- Tertiary button: Text only, brand color text
- Destructive button: Filled, red, high contrast

This hierarchy is never violated. It ensures users always know which action is primary.

### Rule 4: Haptic Feedback for Key Actions

Buttons, swipes, and state changes use haptic feedback. This provides tactile confirmation without visual clutter.

Haptic patterns:

- Button press: Medium impact (iOS) / Click (Android)
- Swipe complete: Heavy impact (iOS) / Long press (Android)
- Success: Success notification (iOS) / Pattern (Android)
- Error: Error notification (iOS) / Reject (Android)

### Rule 5: Reduced Motion Support

All animations have reduced-motion alternatives. Users who disable animations should still get clear feedback.

Alternatives:

- Button press: Opacity change (no scale)
- Screen transition: Instant (no slide)
- Loading spinner: Pulse (no rotation)

## Component Naming Convention

Components follow a consistent naming pattern:

**Format:** `[Component][Variant][State]`

Examples:

- `ButtonPrimary` (primary button, default state)
- `ButtonPrimaryPressed` (primary button, pressed state)
- `ButtonPrimaryDisabled` (primary button, disabled state)
- `CardSchedule` (schedule card)
- `InputText` (text input)
- `InputTextError` (text input, error state)

**Why:** Predictable, hierarchical, easy to search in code.

## Component Props (React Native Example)

Components expose minimal, semantic props:

```typescript
// Button
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // SF Symbol or Material Icon name
}

// Input
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}

// Card
interface CardProps {
  variant: 'schedule' | 'visit-summary';
  client: Client;
  onPress: () => void;
}
```

Why minimal props:

- Fewer decisions for developers
- Harder to misuse
- Easier to maintain

## Component Testing

Every component must be tested for:

### 1. Visual Regression

Screenshots at:

- Default state
- Pressed state
- Disabled state
- Error state (if applicable)
- Dark mode
- 100%, 150%, 200% text scale

### 2. Accessibility

- Screen reader labels (VoiceOver, TalkBack)
- Touch target size (≥44pt/48dp)
- Color contrast (≥4.5:1 for text)
- Dynamic type support (scales correctly)

### 3. Performance

- Animations run at 60fps
- No jank on low-end devices
- Fast render time (<16ms)

### 4. Platform Behavior

- iOS: Haptics, SF Symbols, swipe gestures
- Android: Vibration, Material icons, back button

## Component Documentation

Each component file includes:

1. **Purpose:** What it does and why
2. **Anatomy:** Visual breakdown
3. **Variants:** All supported types
4. **States:** All possible states
5. **Tokens:** Exact token mapping
6. **Behavior:** Interactions and animations
7. **Accessibility:** WCAG compliance
8. **Platform:** iOS vs Android differences
9. **Usage:** When to use, when not to use
10. **Code:** Implementation examples

## Success Criteria

Components succeed if:

1. Developers can build screens without asking designers for specs
2. New screens feel consistent with existing screens
3. Components are reused (not duplicated)
4. Accessibility is built in (not added later)
5. Platform conventions are respected

If any of these fail, the component system has failed.

---

**Next:** Review individual component files for detailed specifications.
