# Spacing Tokens

## Philosophy

Consistent spacing creates visual rhythm and hierarchy. BerthCare uses an 8pt grid system because it's divisible by 2 and 4, works across screen densities, and creates comfortable breathing room.

Spacing is never arbitrary. Every gap, padding, and margin uses a token from the spacing scale.

## Base Grid

**`space.base`**
- **Value:** 8pt / 8dp
- **Usage:** Foundation for all spacing calculations
- **Why 8pt:** Divisible by 2 and 4, works at 1x, 2x, 3x screen densities

---

## Spacing Scale

### `space.xs` (Extra Small)
- **Value:** 4pt / 4dp (0.5 × base)
- **Usage:** Tight spacing, rare
- **Examples:**
  - Gap between icon and label in a button
  - Padding inside small badges
  - Spacing between status icon and status text

**When to use:** Only when default spacing feels too loose. Use sparingly.

---

### `space.sm` (Small)
- **Value:** 8pt / 8dp (1 × base)
- **Usage:** Compact spacing, common
- **Examples:**
  - Vertical spacing between form fields in a dense layout
  - Padding inside compact buttons
  - Gap between label and value in a key-value pair
  - Top padding below navigation bar

**When to use:** When content needs to be compact but still readable.

---

### `space.md` (Medium)
- **Value:** 16pt / 16dp (2 × base)
- **Usage:** Default spacing, most common
- **Examples:**
  - Screen edge padding (horizontal)
  - Padding inside cards
  - Vertical spacing between form fields
  - Gap between screen title and content
  - Padding inside default buttons

**When to use:** Default choice for most spacing needs. If unsure, use `space.md`.

---

### `space.lg` (Large)
- **Value:** 24pt / 24dp (3 × base)
- **Usage:** Generous spacing, section breaks
- **Examples:**
  - Vertical spacing between major sections
  - Padding around modals
  - Space above primary action buttons
  - Gap between screen title and first section

**When to use:** When you need clear visual separation between sections.

---

### `space.xl` (Extra Large)
- **Value:** 32pt / 32dp (4 × base)
- **Usage:** Maximum spacing, rare
- **Examples:**
  - Top padding on empty states
  - Vertical spacing in sparse layouts
  - Padding around full-screen modals

**When to use:** Only for empty states or very sparse layouts. Use sparingly.

---

## Layout Recipes

### Screen Padding

**Horizontal padding:**
- **Value:** `space.md` (16pt)
- **Usage:** All screens, prevents content from touching edges
- **Example:** Today screen, Visit screen, Alert screen

**Top padding (below navigation):**
- **Value:** `space.sm` (8pt)
- **Usage:** Below navigation bar or safe area
- **Why:** Navigation bar already provides visual separation

**Bottom padding:**
- **Value:** `space.md` (16pt)
- **Usage:** Above bottom safe area
- **Why:** Prevents content from being cut off by home indicator

**Code example:**
```css
.screen {
  padding: 8pt 16pt 16pt 16pt; /* top right bottom left */
}
```

---

### Card Spacing

**Card internal padding:**
- **Value:** `space.md` (16pt)
- **Usage:** All sides of card content
- **Example:** Schedule card, visit summary card

**Card vertical spacing (between cards):**
- **Value:** 12pt (1.5 × base, custom value)
- **Usage:** Gap between cards in a list
- **Why:** Tight enough for scanning, loose enough for separation

**Card corner radius:**
- **Value:** 12pt (1.5 × base, custom value)
- **Usage:** All cards
- **Why:** Soft, approachable, not too round

**Code example:**
```css
.card {
  padding: 16pt;
  border-radius: 12pt;
  margin-bottom: 12pt;
}
```

---

### Form Field Spacing

**Vertical spacing between fields:**
- **Value:** `space.md` (16pt)
- **Usage:** Gap between form fields
- **Why:** Comfortable for input, clear separation

**Label to input spacing:**
- **Value:** `space.xs` (4pt)
- **Usage:** Gap between label and input field
- **Why:** Tight association, label belongs to field

**Input internal padding:**
- **Value:** 12pt horizontal, 10pt vertical (custom values)
- **Usage:** Padding inside text inputs
- **Why:** Comfortable tap target, readable text

**Code example:**
```css
.form-field {
  margin-bottom: 16pt;
}

.form-label {
  margin-bottom: 4pt;
}

.form-input {
  padding: 10pt 12pt;
}
```

---

### Button Spacing

**Button internal padding:**
- **Primary/Secondary:** 12pt horizontal, 14pt vertical
- **Tertiary:** 8pt horizontal, 8pt vertical
- **Why:** Minimum 44pt/48dp touch target height

**Button to content spacing:**
- **Value:** `space.lg` (24pt)
- **Usage:** Gap between content and primary action button
- **Why:** Clear visual separation, prevents accidental taps

**Button bottom spacing:**
- **Value:** `space.md` (16pt)
- **Usage:** Distance from bottom of screen
- **Why:** Above safe area, comfortable thumb reach

**Code example:**
```css
.primary-button {
  padding: 14pt 12pt;
  margin-top: 24pt;
  margin-bottom: 16pt;
}
```

---

### List Item Spacing

**List item internal padding:**
- **Value:** `space.md` (16pt) vertical, `space.md` (16pt) horizontal
- **Usage:** Padding inside tappable list items
- **Why:** Comfortable touch target (minimum 44pt/48dp height)

**List item separator:**
- **Value:** 1pt line with `space.md` (16pt) horizontal inset
- **Usage:** Divider between list items
- **Why:** Subtle separation, doesn't compete with content

**Code example:**
```css
.list-item {
  padding: 16pt;
  border-bottom: 1pt solid var(--color-neutral-200);
}
```

---

## Vertical Rhythm Examples

### Today Screen Layout

```
┌─────────────────────────────────────┐
│ [8pt top padding]                   │
│ Today                               │ ← Page heading
│ [16pt gap]                          │
│ ┌─────────────────────────────────┐ │
│ │ [16pt padding]                  │ │
│ │ Margaret Chen                   │ │ ← Schedule card
│ │ 8:00 AM - 9:00 AM               │ │
│ │ [16pt padding]                  │ │
│ └─────────────────────────────────┘ │
│ [12pt gap]                          │
│ ┌─────────────────────────────────┐ │
│ │ [16pt padding]                  │ │
│ │ John Smith                      │ │ ← Schedule card
│ │ 10:00 AM - 11:00 AM             │ │
│ │ [16pt padding]                  │ │
│ └─────────────────────────────────┘ │
│ [16pt bottom padding]               │
└─────────────────────────────────────┘
  ↑ 16pt horizontal padding (both sides)
```

**Spacing breakdown:**
- Screen horizontal padding: 16pt (`space.md`)
- Top padding: 8pt (`space.sm`)
- Title to first card: 16pt (`space.md`)
- Between cards: 12pt (custom, tight for scanning)
- Card internal padding: 16pt (`space.md`)
- Bottom padding: 16pt (`space.md`)

---

### Visit Screen Layout

```
┌─────────────────────────────────────┐
│ [8pt top padding]                   │
│ Visit Details                       │ ← Page heading
│ [24pt gap]                          │
│ Documentation                       │ ← Section heading
│ [16pt gap]                          │
│ Blood Pressure                      │ ← Label
│ [4pt gap]                           │
│ ┌─────────────────────────────────┐ │
│ │ [10pt padding]                  │ │
│ │ 120/80                          │ │ ← Input field
│ │ [10pt padding]                  │ │
│ └─────────────────────────────────┘ │
│ [16pt gap]                          │
│ Wound Assessment                    │ ← Label
│ [4pt gap]                           │
│ ┌─────────────────────────────────┐ │
│ │ [10pt padding]                  │ │
│ │ 2.5cm, minimal drainage         │ │ ← Input field
│ │ [10pt padding]                  │ │
│ └─────────────────────────────────┘ │
│ [24pt gap]                          │
│ ┌─────────────────────────────────┐ │
│ │ [14pt padding]                  │ │
│ │ Complete Visit                  │ │ ← Primary button
│ │ [14pt padding]                  │ │
│ └─────────────────────────────────┘ │
│ [16pt bottom padding]               │
└─────────────────────────────────────┘
```

**Spacing breakdown:**
- Screen horizontal padding: 16pt (`space.md`)
- Top padding: 8pt (`space.sm`)
- Title to section: 24pt (`space.lg`)
- Section to first field: 16pt (`space.md`)
- Label to input: 4pt (`space.xs`)
- Between fields: 16pt (`space.md`)
- Content to button: 24pt (`space.lg`)
- Button internal padding: 14pt vertical, 12pt horizontal
- Bottom padding: 16pt (`space.md`)

---

## Touch Target Spacing

### Minimum Touch Targets

**iOS:**
- **Minimum:** 44 × 44pt
- **Comfortable:** 48 × 48pt
- **Usage:** All tappable elements

**Android:**
- **Minimum:** 48 × 48dp
- **Comfortable:** 56 × 56dp
- **Usage:** All tappable elements

**Why:** Accessibility requirement. Smaller targets are hard to tap, especially for users with motor impairments.

### Touch Target Padding

If visual element is smaller than minimum touch target, add transparent padding:

**Example: 24pt icon button**
```css
.icon-button {
  width: 24pt; /* Visual size */
  height: 24pt;
  padding: 10pt; /* Adds 20pt, total 44pt touch target */
}
```

**Example: Text link**
```css
.text-link {
  padding: 12pt 8pt; /* Ensures 44pt height */
}
```

---

## Responsive Spacing

Spacing adapts to screen size and orientation:

### Small Screens (iPhone SE, small Android)
- Use `space.sm` (8pt) for screen padding (instead of 16pt)
- Reduce card padding to 12pt (instead of 16pt)
- Maintain minimum touch targets (44pt/48dp)

### Large Screens (iPad, tablets)
- Increase screen padding to `space.lg` (24pt)
- Increase card padding to `space.lg` (24pt)
- Maintain same vertical rhythm

### Landscape Orientation
- Increase horizontal padding to `space.lg` (24pt)
- Reduce vertical spacing slightly (more horizontal space available)

**Why:** Adapt to available space while maintaining readability and touch targets.

---

## Accessibility Considerations

### Dynamic Type Scaling

When text scales, spacing must adapt:

**At 100% (default):**
- Card height: 80pt
- Between fields: 16pt

**At 200% (maximum):**
- Card height: 120pt (expands for larger text)
- Between fields: 20pt (slightly more space)

**Rule:** Spacing scales proportionally with text, but not 1:1. Use 1.25x spacing at 200% text scale.

### High Contrast Mode

Spacing remains the same in high contrast mode. Only colors change.

### Reduced Motion

Spacing is not affected by reduced motion settings.

---

## Platform-Specific Adaptations

### iOS
- **Safe area insets:** Respect top and bottom safe areas
- **Navigation bar:** 44pt height (standard)
- **Tab bar:** 49pt height (standard)
- **Home indicator:** 34pt bottom safe area (iPhone X+)

### Android
- **Status bar:** 24dp height (standard)
- **Navigation bar:** 48dp height (standard)
- **System gestures:** 16dp bottom inset (gesture navigation)

**Code example (React Native):**
```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{
  paddingTop: insets.top + 8, // Safe area + 8pt
  paddingBottom: insets.bottom + 16, // Safe area + 16pt
  paddingHorizontal: 16,
}}>
  {/* Content */}
</View>
```

---

## Do's and Don'ts

### Do:
- Use spacing tokens (not hard-coded values)
- Maintain consistent vertical rhythm
- Respect minimum touch targets (44pt/48dp)
- Test on small screens (iPhone SE, small Android)
- Respect safe area insets (iOS notch, Android gestures)

### Don't:
- Hard-code spacing values (use tokens)
- Use spacing smaller than `space.xs` (4pt)
- Create touch targets smaller than 44pt/48dp
- Ignore safe area insets (content will be cut off)
- Use inconsistent spacing (breaks visual rhythm)

---

## Code Examples

### iOS (Swift)

```swift
// Screen padding
view.layoutMargins = UIEdgeInsets(
    top: 8,
    left: 16,
    bottom: 16,
    right: 16
)

// Card spacing
stackView.spacing = 12 // Between cards
cardView.layoutMargins = UIEdgeInsets(
    top: 16,
    left: 16,
    bottom: 16,
    right: 16
)
```

### Android (Kotlin)

```kotlin
// Screen padding
view.setPadding(
    16.dp, // left
    8.dp,  // top
    16.dp, // right
    16.dp  // bottom
)

// Card spacing
recyclerView.addItemDecoration(
    SpacingItemDecoration(12.dp)
)
```

### React Native (JavaScript)

```javascript
// Screen padding
<View style={{
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 16,
}}>
  {/* Content */}
</View>

// Card spacing
<View style={{
  padding: 16,
  marginBottom: 12,
  borderRadius: 12,
}}>
  {/* Card content */}
</View>
```

---

**Next:** Review `animations.md` for motion tokens and timing.
