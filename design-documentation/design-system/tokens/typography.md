# Typography Tokens

## Philosophy

Typography in BerthCare is designed for speed and legibility. Sarah reads this app while standing, walking, in bright sunlight, and under stress. Every typographic decision serves readability.

We use system fonts (SF Pro on iOS, Roboto on Android) because they're optimized for screen reading, load instantly, and support dynamic type scaling.

## Font Families

### `type.font.system`
- **iOS:** SF Pro (system default)
- **Android:** Roboto (system default)
- **Web:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Why:** Instant loading, optimal legibility, accessibility support

### `type.font.mono`
- **iOS:** SF Mono
- **Android:** Roboto Mono
- **Web:** "SF Mono", Monaco, "Courier New", monospace
- **Usage:** Rare, only for technical data (IDs, codes)
- **Example:** Visit ID in debug mode

**No custom fonts:** Custom fonts add load time, reduce legibility, and complicate accessibility. System fonts are perfect for this use case.

---

## Type Scale

Typography scale is based on comfortable reading sizes for mobile devices.

### Page Heading

**Token:** `type.heading.page`

- **Size:** 28pt / 28sp
- **Weight:** Bold (700)
- **Line height:** 34pt (1.21x)
- **Letter spacing:** -0.5pt (tighter for large text)
- **Usage:** Screen titles, used once per screen
- **Example:** "Today" screen title

**Accessibility:**
- Scales with Dynamic Type (iOS) and Font Size (Android)
- At 200% scale: 56pt (still readable, layout adapts)

**Code example:**
```css
font-family: var(--type-font-system);
font-size: 28pt;
font-weight: 700;
line-height: 34pt;
letter-spacing: -0.5pt;
```

---

### Section Heading

**Token:** `type.heading.section`

- **Size:** 22pt / 22sp
- **Weight:** Semibold (600)
- **Line height:** 28pt (1.27x)
- **Letter spacing:** -0.3pt
- **Usage:** Major sections within a screen
- **Example:** "Morning Visits" section header on Today screen

**Accessibility:**
- Scales with system settings
- At 200% scale: 44pt

---

### Card Title

**Token:** `type.title.card`

- **Size:** 17pt / 17sp
- **Weight:** Semibold (600)
- **Line height:** 22pt (1.29x)
- **Letter spacing:** 0pt (default)
- **Usage:** Client names, visit titles, card headers
- **Example:** "Margaret Chen" on schedule card

**Accessibility:**
- Scales with system settings
- At 200% scale: 34pt
- Minimum contrast: 4.5:1 (WCAG AA)

---

### Body Default

**Token:** `type.body.default`

- **Size:** 17pt / 17sp
- **Weight:** Regular (400)
- **Line height:** 26pt (1.53x)
- **Letter spacing:** 0pt
- **Usage:** Visit notes, documentation text, primary content
- **Example:** Visit documentation fields

**Why 17pt:** Apple's recommended body text size. Comfortable for extended reading. Large enough for outdoor visibility.

**Accessibility:**
- Scales with system settings
- At 200% scale: 34pt
- Minimum contrast: 4.5:1 (WCAG AA)

---

### Body Small

**Token:** `type.body.small`

- **Size:** 15pt / 15sp
- **Weight:** Regular (400)
- **Line height:** 20pt (1.33x)
- **Letter spacing:** 0pt
- **Usage:** Secondary content, metadata, helper text
- **Example:** Address on schedule card

**Accessibility:**
- Scales with system settings
- At 200% scale: 30pt
- Minimum contrast: 4.5:1 (WCAG AA)

---

### Label

**Token:** `type.label.default`

- **Size:** 15pt / 15sp
- **Weight:** Regular (400)
- **Line height:** 20pt (1.33x)
- **Letter spacing:** 0pt
- **Usage:** Form labels, button labels, navigation labels
- **Example:** "Blood Pressure" field label

**Accessibility:**
- Scales with system settings
- Minimum contrast: 4.5:1 (WCAG AA)

---

### Caption

**Token:** `type.caption.default`

- **Size:** 13pt / 13sp
- **Weight:** Regular (400)
- **Line height:** 18pt (1.38x)
- **Letter spacing:** 0pt
- **Usage:** Timestamps, footnotes, tertiary information
- **Example:** "Last updated 2 hours ago"

**Accessibility:**
- Scales with system settings
- At 200% scale: 26pt
- Minimum contrast: 4.5:1 (WCAG AA, must use high contrast color)

**Warning:** Caption is the smallest text size. Use sparingly and only for non-critical information.

---

### Button Label

**Token:** `type.button.default`

- **Size:** 17pt / 17sp
- **Weight:** Semibold (600)
- **Line height:** 22pt (1.29x)
- **Letter spacing:** 0pt
- **Usage:** Button labels, call-to-action text
- **Example:** "Complete Visit" button

**Accessibility:**
- Scales with system settings
- Minimum touch target: 44pt height (iOS) / 48dp (Android)

---

## Type Roles and Usage

### Hierarchy Example: Visit Screen

```
┌─────────────────────────────────────┐
│ Visit Details                       │ ← type.heading.page (28pt Bold)
│                                     │
│ Documentation                       │ ← type.heading.section (22pt Semibold)
│                                     │
│ Blood Pressure                      │ ← type.label.default (15pt Regular)
│ 120/80                              │ ← type.body.default (17pt Regular)
│                                     │
│ Wound Assessment                    │ ← type.label.default (15pt Regular)
│ 2.5cm, minimal drainage             │ ← type.body.default (17pt Regular)
│                                     │
│ Last updated 2 hours ago            │ ← type.caption.default (13pt Regular)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Complete Visit              │ │ ← type.button.default (17pt Semibold)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Dynamic Type Support

All text must scale with iOS Dynamic Type and Android Font Size settings.

### iOS Dynamic Type Categories

| Category | Default Size | 200% Size | Usage |
|----------|--------------|-----------|-------|
| Large Title | 34pt | 68pt | Not used in BerthCare |
| Title 1 | 28pt | 56pt | Page headings |
| Title 2 | 22pt | 44pt | Section headings |
| Title 3 | 20pt | 40pt | Not used |
| Headline | 17pt | 34pt | Card titles |
| Body | 17pt | 34pt | Body text |
| Callout | 16pt | 32pt | Not used |
| Subheadline | 15pt | 30pt | Labels |
| Footnote | 13pt | 26pt | Captions |
| Caption 1 | 12pt | 24pt | Not used |
| Caption 2 | 11pt | 22pt | Not used |

**BerthCare uses:** Title 1, Title 2, Headline, Body, Subheadline, Footnote

**Why:** Simpler scale, fewer sizes, clearer hierarchy.

### Android Font Size Settings

| Setting | Scale | Example (17sp base) |
|---------|-------|---------------------|
| Small | 85% | 14.5sp |
| Default | 100% | 17sp |
| Large | 115% | 19.5sp |
| Largest | 130% | 22sp |
| Huge | 200% | 34sp |

### Layout Adaptation

When text scales, layout must adapt:

**At 100% (default):**
- Schedule card: 80pt height
- Client name: 17pt, single line
- Address: 15pt, single line

**At 200% (maximum):**
- Schedule card: 120pt height (expands)
- Client name: 34pt, may wrap to two lines
- Address: 30pt, may wrap to two lines

**Rules:**
- Cards expand vertically (never truncate text)
- Minimum touch targets maintained (44pt/48dp)
- Horizontal scrolling is never required
- Test all screens at 100%, 150%, 200%

---

## Text Styles and Emphasis

### Regular (400)
- **Usage:** Body text, labels, captions
- **Example:** Visit notes, field labels

### Semibold (600)
- **Usage:** Headings, titles, button labels, emphasis
- **Example:** Client names, section headers, "Complete Visit"

### Bold (700)
- **Usage:** Page headings, high emphasis
- **Example:** "Today" screen title

**No other weights:** Three weights are enough. More weights add complexity without value.

---

## Text Color Combinations

Typography tokens are always paired with color tokens:

### Primary Text
- **Style:** `type.body.default`
- **Color:** `color.text.default`
- **Contrast:** 12.63:1 (WCAG AAA ✓)
- **Usage:** Visit notes, documentation

### Secondary Text
- **Style:** `type.body.small` or `type.caption.default`
- **Color:** `color.text.muted`
- **Contrast:** 4.69:1 (WCAG AA ✓)
- **Usage:** Timestamps, metadata

### Inverse Text
- **Style:** `type.button.default`
- **Color:** `color.text.inverse`
- **Contrast:** 4.52:1 on `color.brand.primary` (WCAG AA ✓)
- **Usage:** Button labels on colored backgrounds

### Placeholder Text
- **Style:** `type.body.default`
- **Color:** `color.text.placeholder`
- **Contrast:** 3.12:1 (intentionally lower, indicates placeholder)
- **Usage:** "Tap to add notes"

---

## Special Typography Patterns

### Copy-and-Edit Visual Language

In visit documentation, text color indicates edit state:

**Unchanged (copied from last visit):**
- **Color:** `color.text.muted` (gray)
- **Style:** `type.body.default`
- **Example:** "120/80" (blood pressure from last visit)

**Edited (user changed value):**
- **Color:** `color.text.default` (black)
- **Style:** `type.body.default`
- **Example:** "118/78" (user edited blood pressure)

**Why:** Instant visual feedback. Sarah sees what she changed without reading every field.

### Inline Validation

Error messages appear below fields:

- **Style:** `type.caption.default` (13pt Regular)
- **Color:** `color.state.error.text`
- **Icon:** Red exclamation mark
- **Example:** "⚠ Blood pressure format: 120/80"

---

## Accessibility Considerations

### Minimum Contrast

All text meets WCAG 2.1 AA contrast requirements:

| Text Size | Minimum Contrast | BerthCare |
|-----------|------------------|-----------|
| <18pt regular | 4.5:1 | ✓ 4.69:1+ |
| ≥18pt regular | 3:1 | ✓ 3.04:1+ |
| <14pt bold | 4.5:1 | ✓ 4.69:1+ |
| ≥14pt bold | 3:1 | ✓ 3.04:1+ |

### Screen Reader Support

All text has semantic meaning:
- Headings use proper heading levels (H1, H2)
- Labels are associated with form fields
- Button labels describe actions clearly
- Status text is announced on change

### Dynamic Type Testing

Test all screens at:
- **100%:** Default size (most users)
- **150%:** Large size (common for 40+ users)
- **200%:** Maximum size (accessibility requirement)

**Pass criteria:**
- No text truncation
- No horizontal scrolling
- Touch targets ≥44pt/48dp
- Layout adapts gracefully

---

## Platform-Specific Adaptations

### iOS
- **Font:** SF Pro (system default)
- **Dynamic Type:** Full support for all categories
- **Rendering:** Subpixel antialiasing
- **Weights:** Regular (400), Semibold (600), Bold (700)

### Android
- **Font:** Roboto (system default)
- **Font Size:** Full support for system settings
- **Rendering:** Grayscale antialiasing
- **Weights:** Regular (400), Medium (500), Bold (700)

**Note:** Android uses Medium (500) instead of Semibold (600). Visually similar, platform-appropriate.

---

## Do's and Don'ts

### Do:
- Use system fonts (SF Pro, Roboto)
- Test at 100%, 150%, 200% scale
- Ensure text meets contrast requirements
- Use semantic type tokens (not hard-coded sizes)
- Support dynamic type scaling

### Don't:
- Use custom fonts (adds load time, reduces legibility)
- Hard-code font sizes (use tokens)
- Truncate text with ellipsis (let it wrap)
- Use more than 3 font weights (adds complexity)
- Use font size alone for hierarchy (combine with weight and color)

---

## Code Examples

### iOS (Swift)

```swift
// Page heading
label.font = UIFont.systemFont(ofSize: 28, weight: .bold)
label.adjustsFontForContentSizeCategory = true
label.textColor = UIColor(named: "color.text.default")

// Body text
label.font = UIFont.systemFont(ofSize: 17, weight: .regular)
label.adjustsFontForContentSizeCategory = true
label.numberOfLines = 0 // Allow wrapping
```

### Android (Kotlin)

```kotlin
// Page heading
textView.setTextAppearance(R.style.TextAppearance_BerthCare_Heading_Page)
textView.setTextColor(getColor(R.color.color_text_default))

// Body text
textView.setTextAppearance(R.style.TextAppearance_BerthCare_Body_Default)
textView.maxLines = Int.MAX_VALUE // Allow wrapping
```

### React Native (JavaScript)

```javascript
// Page heading
<Text style={{
  fontFamily: 'System',
  fontSize: 28,
  fontWeight: '700',
  lineHeight: 34,
  color: colors.text.default,
}}>
  Today
</Text>

// Body text
<Text style={{
  fontFamily: 'System',
  fontSize: 17,
  fontWeight: '400',
  lineHeight: 26,
  color: colors.text.default,
}}>
  Visit notes...
</Text>
```

---

**Next:** Review `spacing.md` for layout grid and spacing scale.
