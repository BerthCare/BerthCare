# Navigation

## Purpose

BerthCare has no traditional navigation. No hamburger menus, no tab bars, no navigation drawers. The app opens to Today. That's it.

**Design principle:** The app opens to action, not options.

## App Shell

### No Navigation Menu

BerthCare deliberately has no navigation menu because:

1. There are only three screens (Today, Visit, Alert)
2. Navigation is linear (Today → Visit → back to Today)
3. Menus add complexity without value
4. Sarah doesn't have time to explore menus

What we don't have:

- Hamburger menu (☰)
- Tab bar
- Navigation drawer
- Settings screen (in MVP)
- Profile screen (in MVP)

### App Always Opens to Today

When Sarah opens BerthCare, she sees Today. Always. No splash screen, no "What's New" modal, no decision required.

**Why:** Sarah opens the app to see her schedule. Anything else is friction.

Implementation:

- Deep link to Today screen on app launch
- No splash screen (beyond 1 second OS requirement)
- No onboarding after first use
- No "Resume where you left off" (always Today)

---

## Navigation Patterns

### Forward Navigation (Today → Visit)

**Trigger:** Tap client card on Today screen

Behavior:

- Screen slides in from right (iOS) or fades in (Android)
- Duration: 300ms
- Easing: `motion.ease.standard`
- Haptic: Light impact on tap

Code example:

```javascript
navigation.navigate('Visit', {
  clientId: client.id,
  scheduleId: schedule.id,
});
```

---

### Back Navigation (Visit → Today)

iOS:

- Swipe from left edge (system gesture)
- Back button in top-left corner (< Today)
- Both trigger same animation

Android:

- System back button (hardware or gesture)
- Back button in top-left corner (← Today)
- Both trigger same animation

Behavior:

- Screen slides out to right (iOS) or fades out (Android)
- Duration: 300ms
- Easing: `motion.ease.standard`
- Haptic: Light impact

Code example:

```javascript
navigation.goBack();
```

---

### Emergency Navigation (Any Screen → Alert)

**Trigger:** Tap "Something's wrong" button (always visible)

Behavior:

- Modal slides up from bottom (iOS) or fades in (Android)
- Backdrop fades in (50% black)
- Duration: 300ms
- Easing: `motion.ease.decelerate`
- Haptic: Medium impact

Code example:

```javascript
navigation.navigate('Alert', {
  clientId: client.id,
  modal: true,
});
```

---

## Status Bar

The status bar shows critical system information without clutter.

### iOS Status Bar

Content:

- Time (left)
- Cellular/WiFi signal (right)
- Battery (right)
- Sync status indicator (center, custom)

Style:

- Light content (white text) on dark backgrounds
- Dark content (black text) on light backgrounds
- Translucent background (system default)

### Android Status Bar

Content:

- Time (left)
- Notification icons (left)
- Cellular/WiFi/Battery (right)
- Sync status indicator (in app bar, not status bar)

Style:

- Light or dark based on system theme
- Colored background (matches app bar)

---

## Sync Status Indicator

The sync status indicator is always visible, showing data state.

Location:

- iOS: Center of navigation bar
- Android: Right side of app bar

States:

- **Saved locally:** Gray cloud icon + "Saved locally"
- **Syncing:** Blue spinner + "Syncing..."
- **Synced:** Green checkmark + "Synced"
- **Error:** Red exclamation + "Sync failed"

Visual:

- Icon: 20pt × 20pt
- Text: `type.caption.default` (13pt)
- Color: Matches state (gray, blue, green, red)
- Tappable: Shows sync details on tap

Code example:

```jsx
<SyncIndicator
  status="synced"
  onPress={showSyncDetails}
/>
```

---

## Emergency Button

The emergency button is always accessible, regardless of screen.

Location:

- iOS: Top-right corner of navigation bar
- Android: Top-right corner of app bar
- Alternative: Floating action button (bottom-right, always visible)

Visual:

- Icon: ⚠ or 🚨 (SF Symbol: `exclamationmark.triangle.fill`)
- Color: `color.emergency.primary` (red)
- Size: 24pt × 24pt icon + 10pt padding = 44pt touch target
- Background: Transparent (icon only)

Behavior:

- Tap opens emergency alert modal
- Haptic: Heavy impact
- Animation: Scale 95% on press

Code example:

```jsx
<EmergencyButton
  onPress={() => navigation.navigate('Alert')}
/>
```

---

## Navigation Bar (iOS)

**Height:** 44pt (standard iOS navigation bar)

Content:

- Left: Back button (< Today) or empty
- Center: Screen title or sync indicator
- Right: Emergency button

Style:

- Background: `color.bg.surface` (white in light mode)
- Border: 1pt solid `color.neutral.200` (bottom)
- Title: `type.heading.page` (28pt Bold) or `type.title.card` (17pt Semibold)

Example:

```
┌─────────────────────────────────────┐
│ < Today    [Synced ✓]         ⚠    │ ← Navigation bar (44pt)
├─────────────────────────────────────┤
│                                     │
│ [Screen content]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## App Bar (Android)

**Height:** 56dp (standard Material app bar)

Content:

- Left: Back button (←) or menu button (rare)
- Center: Screen title
- Right: Sync indicator, emergency button

Style:

- Background: `color.bg.surface` (white in light mode)
- Elevation: 4dp shadow
- Title: `type.heading.page` (20sp Medium)

Example:

```
┌─────────────────────────────────────┐
│ ← Today          [Synced ✓]    ⚠   │ ← App bar (56dp)
├─────────────────────────────────────┤
│                                     │
│ [Screen content]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## Safe Area Insets

Navigation respects safe area insets (iOS notch, Android gestures).

iOS:

- Top inset: 44pt (status bar) + 44pt (navigation bar) = 88pt
- Bottom inset: 34pt (home indicator on iPhone X+)
- Content starts below navigation bar
- Content ends above home indicator

Android:

- Top inset: 24dp (status bar) + 56dp (app bar) = 80dp
- Bottom inset: 16dp (gesture navigation) or 48dp (button navigation)
- Content starts below app bar
- Content ends above navigation area

Code example:

```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
}}>
  {/* Content */}
</View>
```

---

## Screen Titles

Screen titles are large and obvious.

Today screen:

- Title: "Today"
- Style: `type.heading.page` (28pt Bold)
- Color: `color.text.default`
- Position: Below navigation bar, 16pt from top

Visit screen:

- Title: Client name (e.g., "Margaret Chen")
- Style: `type.heading.page` (28pt Bold)
- Color: `color.text.default`
- Position: Below navigation bar, 16pt from top

Alert screen:

- Title: "Something's Wrong"
- Style: `type.heading.page` (28pt Bold)
- Color: `color.emergency.text`
- Position: Center of modal

---

## Accessibility

### Screen Reader Navigation

Navigation is announced to screen readers:

Example:

- User taps client card
- Screen reader announces: "Navigating to Margaret Chen visit details"
- Visit screen loads
- Screen reader announces: "Margaret Chen visit details. Heading."

Code example:

```jsx
<TouchableOpacity
  onPress={() => navigation.navigate('Visit')}
  accessibilityLabel="Margaret Chen"
  accessibilityHint="Opens visit details for Margaret Chen"
  accessibilityRole="button"
>
  {/* Card content */}
</TouchableOpacity>
```

### Focus Management

When navigating to a new screen, focus moves to the screen title:

Code example:

```javascript
useEffect(() => {
  if (navigation.isFocused()) {
    titleRef.current?.focus();
  }
}, [navigation]);
```

### Keyboard Navigation (Web, Phase 2)

For web version:

- Tab: Move focus forward
- Shift+Tab: Move focus backward
- Enter/Space: Activate focused element
- Escape: Close modal or go back

---

## Platform-Specific Adaptations

### iOS

- **Navigation:** Swipe from left edge to go back
- **Navigation bar:** 44pt height, translucent background
- **Back button:** < with screen title
- **Haptics:** Light impact on navigation

### Android

- **Navigation:** System back button (hardware or gesture)
- **App bar:** 56dp height, solid background with elevation
- **Back button:** ← arrow icon
- **Haptics:** Click vibration on navigation

---

## Do's and Don'ts

### Do:

- Open app to Today (always)
- Use system navigation patterns (swipe back on iOS, back button on Android)
- Show sync status (always visible)
- Make emergency button accessible (always)
- Respect safe area insets

### Don't:

- Add navigation menus (no hamburger, no tabs)
- Add splash screens (beyond 1 second)
- Add "What's New" modals (friction)
- Hide sync status (always show)
- Block navigation (let users go back anytime)

---

**Next:** Review `cards.md` for schedule and visit summary card specifications.
