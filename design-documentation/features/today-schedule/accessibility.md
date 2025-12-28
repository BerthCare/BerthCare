# Today Schedule: Accessibility

## Screen Reader Support

### VoiceOver (iOS) / TalkBack (Android)

Screen announcement on load:
"Today. Heading. 6 visits scheduled."

Schedule card announcement:
"Margaret Chen, 8:00 AM to 9:00 AM, 123 Oak Street Edmonton, Completed. Button."

Navigation:

- Swipe right: Next element
- Swipe left: Previous element
- Double-tap: Activate (open visit)

Code example:

```jsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Margaret Chen"
  accessibilityHint="Opens visit details for Margaret Chen at 8:00 AM"
  accessibilityState={{ disabled: false }}
>
  <ScheduleCard />
</TouchableOpacity>
```

---

## Dynamic Type Support

Text scaling:

- Page heading: 28pt → 56pt (at 200%)
- Card title: 17pt → 34pt (at 200%)
- Card metadata: 15pt → 30pt (at 200%)

Layout adaptation:

- Cards expand vertically (no truncation)
- Minimum touch targets maintained (44pt/48dp)
- No horizontal scrolling required

**Test at:** 100%, 150%, 200%

---

## Color Contrast

All text meets WCAG 2.1 AA requirements:

| Element       | Foreground | Background | Contrast | WCAG         |
| ------------- | ---------- | ---------- | -------- | ------------ |
| Page heading  | #1F2937    | #F9FAFB    | 12.63:1  | AAA ✓        |
| Card title    | #1F2937    | #FFFFFF    | 12.63:1  | AAA ✓        |
| Card metadata | #6B7280    | #FFFFFF    | 4.69:1   | AA ✓         |
| Status label  | #10B981    | #FFFFFF    | 3.04:1   | AA (large) ✓ |

---

## Touch Targets

All interactive elements meet minimum requirements:

| Element          | Size              | Requirement | Status    |
| ---------------- | ----------------- | ----------- | --------- |
| Schedule card    | Full width × 80pt | 44pt/48dp   | ✓ Exceeds |
| Emergency button | 44pt × 44pt       | 44pt/48dp   | ✓ Meets   |
| Sync indicator   | 44pt × 44pt       | 44pt/48dp   | ✓ Meets   |

---

## Reduced Motion

Standard animations:

- Card press: Scale 98%
- Screen transition: Slide 300ms
- Pull-to-refresh: Spinner rotation

Reduced motion alternatives:

- Card press: Opacity 80% (no scale)
- Screen transition: Instant (no slide)
- Pull-to-refresh: Pulse opacity (no rotation)

Code example:

```javascript
const isReduceMotionEnabled = useReducedMotion();
const animationDuration = isReduceMotionEnabled ? 0 : 300;
```

---

## Focus Management

On screen load:

- Focus moves to page heading ("Today")
- Screen reader announces heading

On navigation:

- Focus moves to first schedule card
- Screen reader announces card details

On modal open:

- Focus moves to modal title
- Focus trapped within modal
- Escape key closes modal (web)

---

**Next:** Review `implementation.md` for developer handoff notes.
