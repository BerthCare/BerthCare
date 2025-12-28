# Accessibility Guidelines

## WCAG 2.1 Level AA Compliance

BerthCare meets WCAG 2.1 Level AA standards. This is the minimum, not the goal.

## 1. Perceivable

### 1.1 Text Alternatives

All non-text content has text alternatives:

- Images: Alt text describing content
- Icons: Accessibility labels describing function
- Photos: Descriptive labels ("Wound photo from November 25")

Code example:

```jsx
<Image
  source={{ uri: client.photoUrl }}
  accessibilityLabel={`Photo of ${client.name}`}
/>
```

### 1.2 Time-based Media

**Not applicable:** BerthCare has no video or audio content.

### 1.3 Adaptable

Content can be presented in different ways:

- Screen readers: All content accessible via VoiceOver/TalkBack
- Dynamic type: Text scales from 100% to 200%
- Layout adapts: No horizontal scrolling, no truncation

### 1.4 Distinguishable

Color contrast:

- Body text: ≥4.5:1 (WCAG AA)
- Large text (≥18pt): ≥3:1 (WCAG AA)
- UI elements: ≥3:1 (WCAG AA)

Color is not the only indicator:

- Sync status: Color + icon + text
- Errors: Color + icon + text
- Status: Color + icon + text

Text spacing:

- Line height: ≥1.5x font size (body text)
- Paragraph spacing: ≥2x font size
- Letter spacing: ≥0.12x font size
- Word spacing: ≥0.16x font size

---

## 2. Operable

### 2.1 Keyboard Accessible

All functionality available via keyboard (web):

- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter/Space: Activate
- Escape: Close modal

**Mobile:** Screen reader gestures (swipe, double-tap).

### 2.2 Enough Time

No time limits:

- Auto-save: 2 seconds (user can continue typing)
- Session timeout: 7 days offline grace period
- No timed actions that can't be extended

### 2.3 Seizures and Physical Reactions

No flashing content:

- No animations flash more than 3 times per second
- No strobing effects
- Reduced motion alternatives available

### 2.4 Navigable

Clear navigation:

- Page titles: Clear, descriptive ("Today", "Margaret Chen")
- Focus order: Logical, top-to-bottom, left-to-right
- Link purpose: Clear from context ("View full history")
- Multiple ways: Back button, navigation bar, gestures

### 2.5 Input Modalities

Touch targets:

- Minimum: 44pt × 44pt (iOS) / 48dp × 48dp (Android)
- Comfortable: 48pt × 48pt (iOS) / 56dp × 56dp (Android)
- Spacing: ≥8pt between targets

Gestures:

- All gestures have alternatives (swipe to complete = button tap)
- No complex gestures (no multi-finger, no paths)

---

## 3. Understandable

### 3.1 Readable

**Language:** English (en-US)

- HTML lang attribute set
- Screen readers use correct pronunciation

**Unusual words:** None (plain language only)

### 3.2 Predictable

Consistent navigation:

- Back button always top-left (iOS) or system back (Android)
- Emergency button always top-right
- Sync indicator always center (iOS) or right (Android)

Consistent identification:

- Icons consistent across screens
- Labels consistent ("Complete Visit", not "Finish" or "Done")

### 3.3 Input Assistance

Error identification:

- Errors clearly identified ("Blood pressure format: 120/80")
- Error location clear (red border on field)
- Error message below field

Labels and instructions:

- All inputs have labels
- Placeholders show format ("120/80")
- Instructions clear and concise

Error prevention:

- Destructive actions require confirmation
- Auto-save prevents data loss
- Validation on blur (not on keystroke)

---

## 4. Robust

### 4.1 Compatible

Valid markup:

- Semantic HTML (web)
- Native components (iOS/Android)
- Accessibility roles set correctly

Name, role, value:

- All interactive elements have accessible names
- Roles set correctly (button, textbox, heading)
- States announced (disabled, selected, expanded)

---

## Platform-Specific Requirements

### iOS (VoiceOver)

Accessibility traits:

- Button: `accessibilityRole="button"`
- Heading: `accessibilityRole="header"`
- Image: `accessibilityRole="image"`

Accessibility labels:

- Clear, concise, action-oriented
- No "button" in label (VoiceOver announces role)

Accessibility hints:

- Optional, provides additional context
- Example: "Opens visit details for Margaret Chen"

Code example:

```jsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Margaret Chen"
  accessibilityHint="Opens visit details"
  accessibilityState={{ disabled: false }}
>
  <ScheduleCard />
</TouchableOpacity>
```

### Android (TalkBack)

Content descriptions:

- All interactive elements have contentDescription
- Images have contentDescription

Accessibility actions:

- Custom actions for complex interactions
- Example: Swipe actions have button alternatives

Code example:

```kotlin
button.contentDescription = "Complete visit"
button.isAccessibilityFocusable = true
```

---

## Testing Requirements

Manual testing:

- VoiceOver (iOS): All screens, all interactions
- TalkBack (Android): All screens, all interactions
- Dynamic Type: 100%, 150%, 200%
- Reduced Motion: All animations have alternatives

Automated testing:

- axe DevTools (web)
- Accessibility Scanner (Android)
- Xcode Accessibility Inspector (iOS)

User testing:

- Test with real users with disabilities
- Test with caregivers over 40 (common age group)
- Test in bright sunlight (outdoor visibility)

---

**Next:** Review `testing.md` for detailed testing procedures.
