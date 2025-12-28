# Emergency Trigger

## Purpose

The emergency trigger lets Sarah call for help instantly. In a real emergency, every second counts.

**Design principle:** Call-first, data-second. No forms before the call.

## Emergency Button

**Location:** Always accessible from any screen

- Option 1: Top-right corner of navigation bar
- Option 2: Floating action button (bottom-right)

Visual:

- Icon: ⚠ or 🚨 (SF Symbol: `exclamationmark.triangle.fill`)
- Color: `color.emergency.primary` (#DC2626 red)
- Size: 24pt × 24pt icon + 10pt padding = 44pt touch target
- Background: Transparent (icon only) or red circle (floating)

Behavior:

- Tap → Open emergency alert modal
- Haptic: Heavy impact (urgent)
- Animation: Scale 95%, 150ms

## Emergency Alert Modal

Content:

```
┌─────────────────────────────────────┐
│ Something's Wrong                   │ ← Red text, 28pt Bold
│                                     │
│ Call your coordinator immediately.  │ ← 17pt Regular
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📞 Call Linda Chen              │ │ ← Large, red button
│ │    +1-780-555-1234              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Optional: Add note after call]    │
└─────────────────────────────────────┘
```

Call Button:

- Background: `color.emergency.primary` (red)
- Label: "Call [Coordinator Name]"
- Sublabel: Phone number
- Height: 64pt (larger than standard button)
- Icon: Phone icon
- Haptic: Heavy impact on tap

Behavior:

1. User taps emergency button
2. Modal appears (300ms)
3. User taps "Call Coordinator"
4. Phone dialer opens immediately with coordinator's number
5. App goes to background
6. User makes call
7. User returns to app
8. Optional: Add note about the alert
9. Alert is logged and synced in background

## After-Call Note (Optional)

Content:

- Text input: "Add a note about this alert (optional)"
- Multiline, 3 lines minimum
- Placeholder: "e.g., Client confused, coordinator advised..."
- Auto-save after 2 seconds

Behavior:

- Note is optional (can skip)
- Auto-saves to local database
- Syncs in background when online
- Coordinator receives email with note

---

## Accessibility

- **Touch target:** 44pt × 44pt minimum (emergency button)
- **Screen reader:** "Emergency alert. Call coordinator immediately."
- **Color contrast:** Red on white = 5.54:1 (WCAG AA ✓)
- **Haptic:** Heavy impact (urgent, unmistakable)

---

## Platform Adaptations

### iOS

- **Phone dialer:** `Linking.openURL('tel:+17805551234')`
- **Haptic:** `notificationWarning` (urgent pattern)
- **Icon:** SF Symbol `exclamationmark.triangle.fill`

### Android

- **Phone dialer:** `Intent.ACTION_DIAL`
- **Haptic:** Long vibration pattern (urgent)
- **Icon:** Material Icon `warning`

---

**Next:** Review platform adaptations for iOS, Android, and Web.
