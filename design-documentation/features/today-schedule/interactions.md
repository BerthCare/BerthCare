# Today Schedule: Interactions

## Tap Client Card

**Trigger:** User taps anywhere on a schedule card

Behavior:

1. Card scales to 98% (150ms, haptic light)
2. Card scales back to 100% (150ms)
3. Navigate to Visit screen (300ms slide transition)
4. Visit screen appears with pre-filled documentation

**Animation:** Horizontal slide (iOS) or fade (Android), 300ms, ease-out

Code example:

```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('Visit', { clientId, scheduleId })}
  activeOpacity={0.98}
>
  <ScheduleCard client={client} schedule={schedule} />
</TouchableOpacity>
```

---

## Pull-to-Refresh

**Trigger:** User pulls down from top of screen

Behavior:

1. Spinner appears below navigation bar
2. Background sync triggers
3. Schedule updates if changes detected
4. Spinner disappears (<2 seconds)

**Visual:** Blue spinner, rotates continuously

Code example:

```javascript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.brand.primary}
    />
  }
>
  {scheduleCards}
</ScrollView>
```

---

## Tap Emergency Button

**Trigger:** User taps red ⚠ button (top-right)

Behavior:

1. Button scales to 95% (150ms, haptic heavy)
2. Emergency modal slides up (300ms)
3. Backdrop fades in (50% black)
4. Focus moves to "Call Coordinator" button

**Animation:** Modal slides up from bottom (iOS) or scales in (Android)

---

## Tap Sync Indicator

**Trigger:** User taps sync status indicator (center of navigation bar)

Behavior:

1. Sync details modal appears
2. Shows sync queue status
3. Shows last sync time
4. Shows retry button (if sync failed)

Content:

```
┌─────────────────────────────────────┐
│ Sync Status                         │
│                                     │
│ Last synced: 2 minutes ago          │
│                                     │
│ Pending:                            │
│ • 1 visit                           │
│ • 2 photos                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Sync Now                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Scroll Behavior

Behavior:

- Vertical scroll only
- Bounce effect at top/bottom (iOS)
- Overscroll glow (Android)
- Navigation bar stays fixed (doesn't scroll)
- Pull-to-refresh available at top

Performance:

- Virtual list rendering (only visible cards rendered)
- Smooth 60fps scrolling
- No jank on low-end devices

---

## Haptic Feedback

**Tap card:** Light impact (subtle confirmation)
**Pull-to-refresh:** Light impact when threshold reached
**Emergency button:** Heavy impact (urgent, unmistakable)
**Visit completed:** Medium impact (success confirmation)

---

**Next:** Review `accessibility.md` for accessibility specifications.
