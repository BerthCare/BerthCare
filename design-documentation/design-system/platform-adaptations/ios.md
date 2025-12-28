# iOS Platform Adaptations

## System Font

**SF Pro** (Apple's system font)

- Optimized for iOS displays
- Supports Dynamic Type
- Includes SF Symbols icon system

## Navigation

**Swipe from left edge** to go back

- System gesture, always available
- Smooth, natural interaction
- Haptic feedback on swipe

**Navigation bar:** 44pt height

- Translucent background
- Large title option (not used in BerthCare)
- Back button: < with previous screen title

## Icons

**SF Symbols** (Apple's icon system)

- Vector icons, scale perfectly
- Match system font weight
- Support color and multicolor variants

Common icons:

- `checkmark.circle.fill` – Completed
- `clock` – Upcoming
- `exclamationmark.triangle.fill` – Emergency
- `icloud` – Sync status
- `photo` – Camera/photos

## Haptics

**Taptic Engine** provides rich haptic feedback:

- `impactLight` – Subtle feedback (toggles, selections)
- `impactMedium` – Standard feedback (button press)
- `impactHeavy` – Strong feedback (important actions)
- `notificationSuccess` – Success confirmation
- `notificationWarning` – Warning/caution
- `notificationError` – Error/failure

## Safe Area Insets

iPhone X and later:

- Top: 44pt status bar + 44pt navigation bar = 88pt
- Bottom: 34pt home indicator
- Sides: 0pt (portrait), variable (landscape)

iPhone 8 and earlier:

- Top: 20pt status bar + 44pt navigation bar = 64pt
- Bottom: 0pt
- Sides: 0pt

## Dark Mode

**Automatic support** via semantic colors:

- System detects dark mode preference
- Colors adapt automatically
- Test in both light and dark mode

## Accessibility

**VoiceOver** (iOS screen reader):

- Announce all interactive elements
- Provide clear labels and hints
- Support swipe gestures for navigation

Dynamic Type:

- Support all text size categories
- Test at 100%, 150%, 200%
- Layout adapts to larger text

---

**Next:** Review `android.md` for Android-specific adaptations.
