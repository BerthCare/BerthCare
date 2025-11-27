# Animation Tokens

## Philosophy

Animations in BerthCare are functional, not decorative. Every animation serves a purpose: confirm an action, show a state change, or provide feedback. Animations that don't serve speed or clarity are removed.

Sarah doesn't have time for delight animations. She needs instant feedback that her action worked.

## Core Principles

### 1. Fast and Decisive
Animations are quick and confident. No lingering, no hesitation. Tap → feedback → done.

### 2. Functional, Not Decorative
Every animation answers a question:
- "Did my tap register?" (button press)
- "Is the app working?" (loading spinner)
- "Did my action complete?" (success checkmark)

### 3. Reduced Motion Support
All animations have reduced-motion alternatives. Users who experience motion sickness must be able to use the app.

### 4. Performance First
Animations run at 60fps (or 120fps on ProMotion displays). Janky animations feel broken.

---

## Duration Tokens

### `motion.fast`
- **Value:** 150ms
- **Usage:** Quick feedback, button presses, toggles
- **Examples:**
  - Button press (scale down)
  - Toggle switch flip
  - Checkbox check
  - Icon state change

**When to use:** Immediate feedback for user actions. User should feel instant response.

**Code example:**
```css
.button:active {
  transform: scale(0.95);
  transition: transform 150ms ease-out;
}
```

---

### `motion.default`
- **Value:** 300ms
- **Usage:** Screen transitions, modal appearances, most animations
- **Examples:**
  - Screen slide transition (Today → Visit)
  - Modal fade in/out
  - Card expand/collapse
  - Status indicator change

**When to use:** Default choice for most animations. Feels responsive without being jarring.

**Code example:**
```css
.screen-transition {
  transition: transform 300ms ease-out;
}
```

---

### `motion.slow`
- **Value:** 500ms
- **Usage:** Rare, only for complex state changes
- **Examples:**
  - Empty state illustration fade in
  - Complex layout transitions
  - Multi-step animations

**When to use:** Only when faster animations feel too abrupt. Use sparingly.

**Warning:** 500ms is slow. Most users will perceive this as lag. Avoid if possible.

---

## Easing Tokens

Easing curves control the acceleration and deceleration of animations.

### `motion.ease.standard`
- **Value:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard)
- **Usage:** Default easing for most animations
- **Behavior:** Starts quickly, decelerates at end
- **Feel:** Responsive, natural

**When to use:** Default choice. Works for 90% of animations.

**Code example:**
```css
transition: all 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
```

---

### `motion.ease.decelerate`
- **Value:** `cubic-bezier(0.0, 0.0, 0.2, 1)` (Material Design decelerate)
- **Usage:** Elements entering the screen
- **Behavior:** Starts fast, decelerates smoothly
- **Feel:** Elements "settle" into place

**When to use:** Modals appearing, screens sliding in, elements entering.

**Code example:**
```css
.modal-enter {
  transition: opacity 300ms cubic-bezier(0.0, 0.0, 0.2, 1);
}
```

---

### `motion.ease.accelerate`
- **Value:** `cubic-bezier(0.4, 0.0, 1, 1)` (Material Design accelerate)
- **Usage:** Elements leaving the screen
- **Behavior:** Starts slow, accelerates away
- **Feel:** Elements "exit" quickly

**When to use:** Modals disappearing, screens sliding out, elements exiting.

**Code example:**
```css
.modal-exit {
  transition: opacity 300ms cubic-bezier(0.4, 0.0, 1, 1);
}
```

---

### `motion.ease.linear`
- **Value:** `linear`
- **Usage:** Rare, only for continuous animations
- **Behavior:** Constant speed, no acceleration
- **Feel:** Robotic, mechanical

**When to use:** Loading spinners, progress bars, continuous rotations.

**Warning:** Linear easing feels unnatural for most animations. Use only for continuous motion.

---

## Animation Patterns

### Button Press

**Animation:**
- Scale down to 95% on press
- Scale back to 100% on release
- Duration: `motion.fast` (150ms)
- Easing: `motion.ease.standard`

**Code example:**
```css
.button:active {
  transform: scale(0.95);
  transition: transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Reduced motion alternative:**
- Opacity change (100% → 80% → 100%)
- No scale transformation

---

### Screen Transition

**Animation:**
- New screen slides in from right (iOS) or fades in (Android)
- Old screen slides out to left (iOS) or fades out (Android)
- Duration: `motion.default` (300ms)
- Easing: `motion.ease.standard`

**Code example (React Navigation):**
```javascript
const screenOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      },
    },
  },
};
```

**Reduced motion alternative:**
- Instant transition (no animation)
- Screen appears immediately

---

### Modal Appearance

**Animation:**
- Backdrop fades in (0% → 50% opacity)
- Modal slides up from bottom (iOS) or fades in (Android)
- Duration: `motion.default` (300ms)
- Easing: `motion.ease.decelerate`

**Code example:**
```css
.modal-backdrop {
  animation: fadeIn 300ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

.modal-content {
  animation: slideUp 300ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 0.5; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

**Reduced motion alternative:**
- Instant appearance (no animation)
- Modal appears immediately with backdrop

---

### Loading Spinner

**Animation:**
- Continuous rotation (360° per second)
- Duration: 1000ms per rotation
- Easing: `motion.ease.linear`

**Code example:**
```css
.spinner {
  animation: rotate 1000ms linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Reduced motion alternative:**
- Static icon (no rotation)
- Pulsing opacity (100% → 50% → 100%)

---

### Sync Status Change

**Animation:**
- Icon cross-fade (old icon fades out, new icon fades in)
- Duration: `motion.fast` (150ms)
- Easing: `motion.ease.standard`

**Example:** "Saved locally" (gray cloud) → "Syncing" (blue spinner) → "Synced" (green checkmark)

**Code example:**
```css
.sync-icon {
  transition: opacity 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.sync-icon-exit {
  opacity: 0;
}

.sync-icon-enter {
  opacity: 1;
}
```

**Reduced motion alternative:**
- Instant icon change (no fade)
- Icon changes immediately

---

### Swipe to Complete

**Animation:**
- Card slides up and fades out
- Duration: `motion.default` (300ms)
- Easing: `motion.ease.accelerate`
- Haptic feedback: Medium impact (iOS)

**Code example:**
```javascript
Animated.parallel([
  Animated.timing(translateY, {
    toValue: -100,
    duration: 300,
    easing: Easing.bezier(0.4, 0.0, 1, 1),
    useNativeDriver: true,
  }),
  Animated.timing(opacity, {
    toValue: 0,
    duration: 300,
    easing: Easing.bezier(0.4, 0.0, 1, 1),
    useNativeDriver: true,
  }),
]).start();
```

**Reduced motion alternative:**
- Instant removal (no animation)
- Card disappears immediately

---

### Success Confirmation

**Animation:**
- Green checkmark scales in (0% → 120% → 100%)
- Duration: `motion.default` (300ms)
- Easing: `motion.ease.decelerate`
- Haptic feedback: Success notification (iOS)

**Code example:**
```css
.success-checkmark {
  animation: scaleIn 300ms cubic-bezier(0.0, 0.0, 0.2, 1);
}

@keyframes scaleIn {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

**Reduced motion alternative:**
- Instant appearance (no scale)
- Checkmark appears immediately

---

## Haptic Feedback

Haptic feedback is part of the animation system. It provides tactile confirmation without visual clutter.

### iOS Haptic Patterns

**`haptic.light`**
- **Usage:** Subtle feedback, toggles, selections
- **Example:** Toggle switch flip

**`haptic.medium`**
- **Usage:** Standard feedback, button presses
- **Example:** Primary button tap

**`haptic.heavy`**
- **Usage:** Strong feedback, important actions
- **Example:** Complete visit swipe

**`haptic.success`**
- **Usage:** Success confirmation
- **Example:** Visit synced successfully

**`haptic.warning`**
- **Usage:** Warning or caution
- **Example:** Sync failed

**`haptic.error`**
- **Usage:** Error or failure
- **Example:** Invalid input

**Code example (React Native):**
```javascript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Button press
ReactNativeHapticFeedback.trigger('impactMedium');

// Success
ReactNativeHapticFeedback.trigger('notificationSuccess');

// Error
ReactNativeHapticFeedback.trigger('notificationError');
```

### Android Haptic Patterns

**`haptic.click`**
- **Usage:** Standard feedback, button presses
- **Example:** Primary button tap

**`haptic.longPress`**
- **Usage:** Long press confirmation
- **Example:** Hold to delete

**`haptic.reject`**
- **Usage:** Error or invalid action
- **Example:** Invalid input

**Code example (React Native):**
```javascript
import { Vibration } from 'react-native';

// Button press
Vibration.vibrate(10); // 10ms

// Error
Vibration.vibrate([0, 50, 50, 50]); // Pattern: wait, vibrate, wait, vibrate
```

---

## Reduced Motion

All animations must have reduced-motion alternatives for users who experience motion sickness.

### Detecting Reduced Motion

**iOS:**
```swift
let isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
```

**Android:**
```kotlin
val isReduceMotionEnabled = Settings.Global.getFloat(
    contentResolver,
    Settings.Global.TRANSITION_ANIMATION_SCALE,
    1f
) == 0f
```

**React Native:**
```javascript
import { AccessibilityInfo } from 'react-native';

const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
```

### Reduced Motion Alternatives

| Animation         | Standard     | Reduced Motion |
|-------------------|--------------|----------------|
| Button press      | Scale down   | Opacity change |
| Screen transition | Slide        | Instant        |
| Modal appearance  | Slide up     | Instant        |
| Loading spinner   | Rotate       | Pulse opacity  |
| Sync status       | Fade         | Instant        |
| Swipe complete    | Slide + fade | Instant        |
| Success checkmark | Scale in     | Instant        |

**Code example:**
```javascript
const animationDuration = isReduceMotionEnabled ? 0 : 300;

Animated.timing(value, {
  toValue: 1,
  duration: animationDuration,
  useNativeDriver: true,
}).start();
```

---

## Performance Considerations

### 60fps Target

All animations must run at 60fps (16.67ms per frame) or 120fps on ProMotion displays (8.33ms per frame).

**How to achieve:**
- Use native driver (`useNativeDriver: true` in React Native)
- Animate only transform and opacity (GPU-accelerated)
- Avoid animating layout properties (width, height, padding)
- Avoid animating shadows (expensive)

**Code example:**
```javascript
// Good: GPU-accelerated
Animated.timing(translateY, {
  toValue: 100,
  useNativeDriver: true, // Runs on GPU
}).start();

// Bad: Runs on JS thread
Animated.timing(height, {
  toValue: 100,
  useNativeDriver: false, // Runs on JS thread, janky
}).start();
```

### Animation Profiling

Test animations on real devices (not simulators):
- iPhone SE (slowest iOS device)
- Low-end Android (e.g., Samsung Galaxy A series)
- Enable "Show FPS" in developer settings
- Ensure animations stay at 60fps

**If animations drop below 60fps:**
- Simplify animation (fewer properties)
- Reduce duration (faster = less noticeable jank)
- Remove animation entirely (instant is better than janky)

---

## Platform-Specific Adaptations

### iOS
- **Navigation:** Horizontal slide (right to left)
- **Modals:** Slide up from bottom
- **Haptics:** Rich haptic feedback (Taptic Engine)
- **Easing:** iOS-style curves (slightly different from Material)

### Android
- **Navigation:** Fade or vertical slide (depends on Material version)
- **Modals:** Fade in with scale
- **Haptics:** Basic vibration patterns
- **Easing:** Material Design curves

**Code example (React Navigation):**
```javascript
const screenOptions = Platform.select({
  ios: {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  },
  android: {
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
  },
});
```

---

## Do's and Don'ts

### Do:
- Use animation tokens (not hard-coded durations)
- Provide reduced-motion alternatives
- Test on real devices (not simulators)
- Use native driver for performance
- Combine animations with haptic feedback

### Don't:
- Animate for decoration (only for function)
- Use slow animations (>500ms)
- Animate layout properties (width, height, padding)
- Ignore reduced motion settings
- Use linear easing for most animations (feels robotic)

---

## Code Examples

### iOS (Swift + UIKit)

```swift
// Button press
UIView.animate(withDuration: 0.15, animations: {
    button.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
}) { _ in
    UIView.animate(withDuration: 0.15) {
        button.transform = .identity
    }
}

// Screen transition
let transition = CATransition()
transition.duration = 0.3
transition.type = .push
transition.subtype = .fromRight
transition.timingFunction = CAMediaTimingFunction(
    controlPoints: 0.4, 0.0, 0.2, 1.0
)
navigationController?.view.layer.add(transition, forKey: nil)
```

### Android (Kotlin)

```kotlin
// Button press
button.animate()
    .scaleX(0.95f)
    .scaleY(0.95f)
    .setDuration(150)
    .setInterpolator(FastOutSlowInInterpolator())
    .withEndAction {
        button.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(150)
            .start()
    }
    .start()

// Screen transition
supportFragmentManager.beginTransaction()
    .setCustomAnimations(
        R.anim.slide_in_right,
        R.anim.slide_out_left,
        R.anim.slide_in_left,
        R.anim.slide_out_right
    )
    .replace(R.id.container, fragment)
    .addToBackStack(null)
    .commit()
```

### React Native (JavaScript)

```javascript
// Button press
const scale = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.timing(scale, {
    toValue: 0.95,
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  Animated.timing(scale, {
    toValue: 1,
    duration: 150,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    useNativeDriver: true,
  }).start();
};

<Animated.View style={{ transform: [{ scale }] }}>
  <TouchableWithoutFeedback
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
  >
    <View>{/* Button content */}</View>
  </TouchableWithoutFeedback>
</Animated.View>
```

---

**Next:** Review `/design-system/components/` for component specifications that use these animation tokens.
