# Forms

## Purpose

Forms in BerthCare are designed for speed, not data collection. The copy-and-edit pattern means most fields are pre-filled. Sarah only taps what changed.

**Design principle:** Assume nothing changed. Pre-fill everything. Make edits obvious.

## Form Patterns

### Text Input (Single-Line)

**Purpose:** Short text entry (blood pressure, temperature, single-line notes).

**Visual:**
- Background: `color.bg.surface` (white)
- Border: 1pt solid `color.neutral.200` (default), `color.brand.primary` (focused), `color.state.error` (error)
- Text: `type.body.default` (17pt Regular)
- Placeholder: `color.text.placeholder` (gray)
- Padding: 12pt horizontal, 10pt vertical
- Corner radius: 8pt
- Minimum height: 44pt

**States:**
- **Default:** Gray border, placeholder text
- **Focused:** Blue border, cursor visible
- **Filled (unchanged):** Gray text (copied from last visit)
- **Filled (edited):** Black text (user changed value)
- **Error:** Red border, error message below
- **Disabled:** 40% opacity, no interaction

**Code example:**
```jsx
<Input
  label="Blood Pressure"
  value="120/80"
  onChange={handleChange}
  placeholder="120/80"
  keyboardType="numeric"
/>
```

---

### Multiline Input (Notes)

**Purpose:** Long-form text entry (visit notes, observations, detailed documentation).

**Visual:**
- Same as text input, but:
- Minimum height: 88pt (5 lines of text)
- Expands vertically as user types
- No maximum height (scrolls if needed)

**Behavior:**
- Auto-expands to fit content
- Scrolls when content exceeds screen height
- Keyboard has "Done" button (not "Return")

**Code example:**
```jsx
<Input
  label="Visit Notes"
  value={notes}
  onChange={handleChange}
  placeholder="Tap to add notes"
  multiline
  numberOfLines={5}
/>
```

---

### Numeric Input (Vitals)

**Purpose:** Numeric entry with specific format (blood pressure, temperature, measurements).

**Visual:**
- Same as text input
- Keyboard: Numeric with decimal point
- Format validation on blur

**Validation patterns:**
- Blood pressure: `120/80` (systolic/diastolic)
- Temperature: `36.5` (decimal)
- Wound size: `2.5cm` (number + unit)

**Error handling:**
- Inline validation on blur (not on every keystroke)
- Error message below field: "Format: 120/80"
- Red border, red error text
- Field remains editable (don't block user)

**Code example:**
```jsx
<Input
  label="Blood Pressure"
  value={bloodPressure}
  onChange={handleChange}
  keyboardType="numeric"
  error={validationError}
  placeholder="120/80"
/>
```

---

### Tap-to-Edit Row (Copy-and-Edit)

**Purpose:** Pre-filled field that looks like static text until tapped. Core pattern for visit documentation.

**Visual (unfocused):**
- Looks like a key-value pair
- Label: `type.label.default` (15pt Regular), `color.text.muted`
- Value: `type.body.default` (17pt Regular), `color.text.muted` (unchanged) or `color.text.default` (edited)
- No border, no background
- Tap anywhere on row to edit

**Visual (focused):**
- Transforms into text input
- Border appears (blue)
- Cursor appears at end of text
- Keyboard opens

**Behavior:**
1. User taps row
2. Row transforms to input (150ms animation)
3. Keyboard opens
4. User edits text
5. Text color changes to black (indicates edit)
6. User taps "Done" or taps outside
7. Keyboard closes
8. Input transforms back to row (150ms animation)
9. Auto-save triggers (2 seconds after last keystroke)

**Code example:**
```jsx
<TapToEditRow
  label="Blood Pressure"
  value="120/80"
  onChange={handleChange}
  isEdited={isEdited}
  keyboardType="numeric"
/>
```

---

## Form Layout

### Vertical Rhythm

**Spacing between fields:**
- Default: `space.md` (16pt)
- Compact: `space.sm` (8pt) (rare, only for dense forms)

**Label to input spacing:**
- `space.xs` (4pt) (tight association)

**Section spacing:**
- Between sections: `space.lg` (24pt)
- Section heading to first field: `space.md` (16pt)

**Example layout:**
```
┌─────────────────────────────────────┐
│ Documentation                       │ ← Section heading
│ [16pt space]                        │
│ Blood Pressure                      │ ← Label
│ [4pt space]                         │
│ ┌─────────────────────────────────┐ │
│ │ 120/80                          │ │ ← Input
│ └─────────────────────────────────┘ │
│ [16pt space]                        │
│ Wound Assessment                    │ ← Label
│ [4pt space]                         │
│ ┌─────────────────────────────────┐ │
│ │ 2.5cm, minimal drainage         │ │ ← Input
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Labels and Placeholders

### Label Guidelines

**Good labels:**
- Clear and specific: "Blood Pressure", "Wound Assessment"
- Action-oriented: "Visit Notes", "Observations"
- Consistent terminology: Always "Blood Pressure", never "BP" or "Blood Press"

**Bad labels:**
- Vague: "Field 1", "Input"
- Abbreviated: "BP", "Temp"
- Technical: "vitals_bp", "assessment_wound"

### Placeholder Guidelines

**Good placeholders:**
- Show format: "120/80", "36.5°C"
- Provide example: "e.g., Wound healing well"
- Indicate action: "Tap to add notes"

**Bad placeholders:**
- Repeat label: "Enter blood pressure"
- Vague: "Type here"
- Empty: No placeholder (confusing for empty fields)

---

## Validation

### Inline Validation

Validation happens on blur (when user leaves field), not on every keystroke.

**Why:** Keystroke validation is annoying. Let users finish typing before showing errors.

**Error display:**
- Red border on input
- Error message below input
- Error icon (⚠) before message
- Error text: `type.caption.default` (13pt), `color.state.error.text`

**Example:**
```
┌─────────────────────────────────────┐
│ Blood Pressure                      │
│ ┌─────────────────────────────────┐ │
│ │ 120                             │ │ ← Red border
│ └─────────────────────────────────┘ │
│ ⚠ Format: 120/80                    │ ← Error message
└─────────────────────────────────────┘
```

### Validation Rules

**Blood pressure:**
- Format: `systolic/diastolic`
- Range: 60-250 / 40-150
- Error: "Format: 120/80" or "Value out of range"

**Temperature:**
- Format: `##.#` (decimal)
- Range: 35.0-42.0°C
- Error: "Format: 36.5" or "Value out of range"

**Wound size:**
- Format: `#.#cm` or `#.#mm`
- Range: 0.1-50.0
- Error: "Format: 2.5cm"

**General text:**
- No validation (free-form)
- Maximum length: 1000 characters (soft limit, shows warning at 900)

---

## Copy-and-Edit Visual Language

The core innovation of BerthCare forms.

### Unchanged Fields (Copied)

- Text color: `color.text.muted` (gray)
- Visual indicator: Subtle, not distracting
- Meaning: "This was copied from last visit, you haven't changed it"

### Edited Fields (Changed)

- Text color: `color.text.default` (black)
- Visual indicator: Bold, obvious
- Meaning: "You changed this value"

### Empty Fields (No Previous Value)

- Text color: `color.text.placeholder` (light gray)
- Placeholder: "Tap to add..."
- Meaning: "No previous value, add one now"

**Example:**
```
┌─────────────────────────────────────┐
│ Blood Pressure                      │
│ 120/80                              │ ← Gray (unchanged)
│                                     │
│ Wound Assessment                    │
│ 2.5cm, minimal drainage             │ ← Black (edited)
│                                     │
│ Additional Notes                    │
│ Tap to add notes                    │ ← Light gray (empty)
└─────────────────────────────────────┘
```

---

## Auto-Save Behavior

Forms auto-save after 2 seconds of inactivity. No "Save" button.

**Flow:**
1. User edits field
2. Text color changes to black (visual feedback)
3. 2-second timer starts
4. If user continues typing, timer resets
5. After 2 seconds of inactivity, auto-save triggers
6. Sync status indicator updates: "Saved locally"
7. Background sync queues the change

**Visual feedback:**
- No intrusive "Saving..." message
- Sync status indicator shows state
- User can continue working immediately

**Code example:**
```javascript
const [value, setValue] = useState('120/80');
const [isEdited, setIsEdited] = useState(false);

const handleChange = (newValue) => {
  setValue(newValue);
  setIsEdited(true);
  debouncedSave(newValue); // 2-second debounce
};

const debouncedSave = useMemo(
  () => debounce((value) => {
    saveToLocal(value);
    queueSync(value);
  }, 2000),
  []
);
```

---

## Accessibility

### Touch Targets

All form fields meet minimum touch target requirements:
- Input fields: 44pt height minimum
- Tap-to-edit rows: 44pt height minimum
- Labels: Not interactive (no touch target requirement)

### Screen Reader Labels

All inputs have clear, descriptive labels:

**Code example:**
```jsx
<Input
  label="Blood Pressure"
  value="120/80"
  accessibilityLabel="Blood pressure"
  accessibilityHint="Enter systolic over diastolic, for example 120 over 80"
/>
```

### Error Announcements

Errors are announced to screen readers:

**Code example:**
```jsx
<Input
  label="Blood Pressure"
  value="120"
  error="Format: 120/80"
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
/>
```

### Dynamic Type

Form fields scale with system font settings:
- Labels: Scale with text
- Input text: Scale with text
- Input height: Expands to accommodate larger text
- Minimum touch target: Always maintained (44pt/48dp)

---

## Platform Adaptations

### iOS
- **Keyboard:** iOS system keyboard
- **Done button:** Blue "Done" button in keyboard toolbar
- **Autocorrect:** Disabled for vitals, enabled for notes
- **Haptics:** Light impact when field becomes focused

### Android
- **Keyboard:** Android system keyboard
- **Done button:** Checkmark icon in keyboard
- **Autocorrect:** Disabled for vitals, enabled for notes
- **Haptics:** Click vibration when field becomes focused

---

## Do's and Don'ts

### Do:
- Pre-fill fields from last visit (copy-and-edit)
- Use gray text for unchanged values
- Use black text for edited values
- Auto-save after 2 seconds
- Validate on blur (not on keystroke)
- Show clear error messages

### Don't:
- Use blank forms (always pre-fill)
- Use "Save" buttons (auto-save)
- Validate on every keystroke (annoying)
- Block submission on validation errors (allow saving invalid data, show warning)
- Use vague error messages ("Invalid input")

---

**Next:** Review `navigation.md` for app shell and navigation patterns.
