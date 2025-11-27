# Today Schedule: Implementation

## Component Mapping

**Screen:** `TodayScreen.tsx`
**Components:**
- `ScheduleCard` (from `cards.md`)
- `SyncIndicator` (from `navigation.md`)
- `EmergencyButton` (from `emergency-trigger.md`)
- `EmptyState` (custom for this screen)

## Data Flow

**On app launch:**
1. Query local SQLite for today's schedule
2. Render cards from cache (instant, <100ms)
3. Background sync triggers (if online)
4. Update UI if schedule changed (rare)

**Query:**
```sql
SELECT s.*, c.name, c.photoUrl, c.address
FROM schedules s
JOIN clients c ON s.clientId = c.id
WHERE s.caregiverId = ?
AND s.scheduledDate = CURRENT_DATE
AND s.status != 'cancelled'
ORDER BY s.scheduledTime ASC
```

**Code example:**
```typescript
const TodayScreen = () => {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadScheduleFromCache();
    syncScheduleInBackground();
  }, []);

  const loadScheduleFromCache = async () => {
    const cached = await db.query('SELECT ...');
    setSchedule(cached);
  };

  const syncScheduleInBackground = async () => {
    if (isOnline) {
      const updated = await api.getSchedule(today);
      if (hasChanges(cached, updated)) {
        await db.update(updated);
        setSchedule(updated);
      }
    }
  };

  return (
    <ScrollView refreshControl={<RefreshControl ... />}>
      {schedule.map(item => (
        <ScheduleCard
          key={item.id}
          schedule={item}
          onPress={() => navigation.navigate('Visit', { scheduleId: item.id })}
        />
      ))}
    </ScrollView>
  );
};
```

---

## Performance Optimization

**Virtual list rendering:**
- Use `FlatList` (React Native) or `RecyclerView` (Android native)
- Only render visible cards + 2 above/below
- Typical: 6-8 cards, all fit on screen (no virtualization needed)

**Image caching:**
- Pre-load client photos on app launch
- Cache photos for 30 days
- Use `react-native-fast-image` or similar

**Background sync:**
- Debounce sync requests (max 1 per 30 seconds)
- Use exponential backoff on failure
- Queue sync requests in SQLite

---

## Edge Cases to Test

**No visits today:**
- Show empty state
- Sync indicator still works
- Emergency button still accessible

**All visits completed:**
- All cards show green checkmarks
- Sync status shows "Synced"
- No action required

**Offline for 7+ days:**
- Show "Connect to internet" message
- Block new visits (auth token expired)
- Allow viewing cached visits (read-only)

**Schedule changes while app open:**
- Background sync detects changes
- Update UI smoothly (no jarring refresh)
- Preserve scroll position

**Very long client names or addresses:**
- Truncate with ellipsis (...)
- Full text visible on tap (visit screen)
- Card height expands if needed (dynamic type)

---

## Testing Checklist

**Functional:**
- [ ] App opens to Today screen (<1 second)
- [ ] Schedule loads from cache (instant)
- [ ] Background sync updates schedule (if changes)
- [ ] Tap card navigates to Visit screen (<300ms)
- [ ] Pull-to-refresh works
- [ ] Emergency button opens alert modal
- [ ] Sync indicator shows correct status

**Performance:**
- [ ] Cold start <1 second
- [ ] Screen transition <300ms
- [ ] Scroll at 60fps (no jank)
- [ ] Background sync doesn't block UI

**Accessibility:**
- [ ] VoiceOver/TalkBack announces all elements
- [ ] Dynamic type scales correctly (100%, 150%, 200%)
- [ ] Touch targets ≥44pt/48dp
- [ ] Color contrast ≥4.5:1 (text)
- [ ] Reduced motion alternatives work

**Offline:**
- [ ] Works offline (cached data)
- [ ] Sync queues changes
- [ ] Syncs when online
- [ ] No data loss

**Edge cases:**
- [ ] Empty state (no visits)
- [ ] Error state (sync failed)
- [ ] Dark mode
- [ ] Landscape orientation
- [ ] Small screens (iPhone SE)
- [ ] Large screens (iPad)

---

**Next:** Review other feature folders for Visit Documentation, Emergency Alert, Offline Sync, and Onboarding.
