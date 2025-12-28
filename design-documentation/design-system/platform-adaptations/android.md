# Android Platform Adaptations

## System Font

**Roboto** (Google's system font)

- Optimized for Android displays
- Supports system font size settings
- Clean, modern, highly legible

## Navigation

**System back button** (hardware or gesture)

- Hardware button (older devices)
- Gesture navigation (newer devices)
- Back arrow in app bar (also triggers back)

**App bar:** 56dp height

- Solid background with elevation (4dp shadow)
- Title centered or left-aligned
- Action icons on right

## Icons

**Material Icons** (Google's icon system)

- Vector icons, scale perfectly
- Consistent with Material Design
- Outlined style (matches BerthCare aesthetic)

Common icons:

- `check_circle` – Completed
- `schedule` – Upcoming
- `warning` – Emergency
- `cloud` – Sync status
- `photo_camera` – Camera/photos

## Haptics

Vibration patterns:

- `click` – 10ms vibration (button press)
- `longPress` – 50ms vibration (long press)
- `reject` – Pattern: [0, 50, 50, 50] (error)

**Note:** Android haptics are less sophisticated than iOS Taptic Engine. Use sparingly.

## Safe Area Insets

Gesture navigation:

- Top: 24dp status bar + 56dp app bar = 80dp
- Bottom: 16dp gesture area
- Sides: 0dp

Button navigation:

- Top: 24dp status bar + 56dp app bar = 80dp
- Bottom: 48dp navigation bar
- Sides: 0dp

## Dark Mode

**Automatic support** via system theme:

- System detects dark mode preference
- Colors adapt automatically
- Test in both light and dark mode

## Accessibility

**TalkBack** (Android screen reader):

- Announce all interactive elements
- Provide clear labels and hints
- Support swipe gestures for navigation

Font Size:

- Support system font size settings
- Test at Small, Default, Large, Largest, Huge
- Layout adapts to larger text

## Device Fragmentation

Test on:

- Small screens (5" displays)
- Large screens (6.5"+ displays)
- Different aspect ratios (16:9, 18:9, 20:9)
- Different densities (mdpi, hdpi, xhdpi, xxhdpi)

---

**Next:** Review `web.md` for web-specific adaptations (Phase 2).
