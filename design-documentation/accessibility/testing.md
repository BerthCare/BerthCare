# Accessibility Testing

## Testing Procedures

### 1. Screen Reader Testing

iOS (VoiceOver):

1. Enable VoiceOver: Settings → Accessibility → VoiceOver
2. Navigate through all screens
3. Verify all elements are announced
4. Verify labels are clear and concise
5. Verify actions work (double-tap to activate)

Android (TalkBack):

1. Enable TalkBack: Settings → Accessibility → TalkBack
2. Navigate through all screens
3. Verify all elements are announced
4. Verify labels are clear and concise
5. Verify actions work (double-tap to activate)

Pass criteria:

- All interactive elements announced
- Labels are clear (no "button button")
- Navigation is logical
- Actions work correctly

---

### 2. Dynamic Type Testing

iOS:

1. Settings → Accessibility → Display & Text Size → Larger Text
2. Test at 100%, 150%, 200%
3. Verify text scales correctly
4. Verify layout adapts (no truncation, no horizontal scrolling)
5. Verify touch targets maintained (≥44pt)

Android:

1. Settings → Display → Font size
2. Test at Small, Default, Large, Largest, Huge
3. Verify text scales correctly
4. Verify layout adapts
5. Verify touch targets maintained (≥48dp)

Pass criteria:

- Text scales from 100% to 200%
- Layout adapts without breaking
- No horizontal scrolling
- Touch targets ≥44pt/48dp

---

### 3. Color Contrast Testing

Tools:

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Stark plugin (Figma)
- Xcode Accessibility Inspector

Test all text:

- Body text: ≥4.5:1
- Large text (≥18pt): ≥3:1
- UI elements: ≥3:1

Pass criteria:

- All text meets WCAG AA
- UI elements meet WCAG AA

---

### 4. Touch Target Testing

Manual testing:

1. Tap all interactive elements
2. Measure touch targets (Xcode/Android Studio)
3. Verify ≥44pt (iOS) / 48dp (Android)

Pass criteria:

- All interactive elements ≥44pt/48dp
- Spacing between targets ≥8pt

---

### 5. Reduced Motion Testing

iOS:

1. Settings → Accessibility → Motion → Reduce Motion
2. Test all animations
3. Verify alternatives work (instant transitions, opacity changes)

Android:

1. Settings → Accessibility → Remove animations
2. Test all animations
3. Verify alternatives work

Pass criteria:

- All animations have alternatives
- Feedback is still clear (haptic, opacity)

---

### 6. Keyboard Navigation Testing (Web)

Test:

1. Tab through all interactive elements
2. Verify focus order is logical
3. Verify focus indicators are visible (2pt blue outline)
4. Verify Enter/Space activates
5. Verify Escape closes modals

Pass criteria:

- All interactive elements reachable via keyboard
- Focus order is logical
- Focus indicators visible
- Keyboard shortcuts work

---

## Automated Testing

### iOS (Xcode Accessibility Inspector)

Run:

1. Xcode → Open Developer Tool → Accessibility Inspector
2. Select device/simulator
3. Run audit
4. Fix all issues

Common issues:

- Missing accessibility labels
- Low contrast
- Small touch targets

---

### Android (Accessibility Scanner)

Run:

1. Install Accessibility Scanner from Play Store
2. Enable scanner
3. Navigate through app
4. Review suggestions
5. Fix all issues

Common issues:

- Missing content descriptions
- Low contrast
- Small touch targets

---

### Web (axe DevTools)

Run:

1. Install axe DevTools browser extension
2. Open app in browser
3. Run scan
4. Fix all issues

Common issues:

- Missing alt text
- Low contrast
- Missing ARIA labels

---

## User Testing

### Test with Real Users

Recruit:

- Caregivers with visual impairments
- Caregivers with motor impairments
- Caregivers over 40 (common age group)
- Caregivers who use screen readers daily

Test scenarios:

1. Open app and find next visit
2. Document a visit
3. Call coordinator in emergency
4. Review sync status

Observe:

- Can they complete tasks?
- Do they struggle with any interactions?
- Do they understand feedback?
- Do they feel confident using the app?

Pass criteria:

- ≥90% task completion rate
- No critical usability issues
- Users feel confident

---

## Testing Checklist

Screen Reader:

- [ ] All elements announced (VoiceOver/TalkBack)
- [ ] Labels are clear and concise
- [ ] Navigation is logical
- [ ] Actions work correctly

Dynamic Type:

- [ ] Text scales from 100% to 200%
- [ ] Layout adapts without breaking
- [ ] No horizontal scrolling
- [ ] Touch targets maintained

Color Contrast:

- [ ] Body text ≥4.5:1
- [ ] Large text ≥3:1
- [ ] UI elements ≥3:1

Touch Targets:

- [ ] All interactive elements ≥44pt/48dp
- [ ] Spacing between targets ≥8pt

Reduced Motion:

- [ ] All animations have alternatives
- [ ] Feedback is still clear

Keyboard Navigation (Web):

- [ ] All elements reachable via keyboard
- [ ] Focus order is logical
- [ ] Focus indicators visible

User Testing:

- [ ] ≥90% task completion rate
- [ ] No critical usability issues
- [ ] Users feel confident

---

**Next:** Review `compliance.md` for legal compliance requirements.
