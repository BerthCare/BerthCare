# Emergency Alert: Implementation

## Component Mapping

**Screen:** `AlertScreen.tsx` (modal)
Components:

- `EmergencyButton` (from `emergency-trigger.md`)
- `DestructiveButton` (red, large)
- `TextInput` (optional note)

## Data Flow

On emergency button tap:

1. Open modal
2. Pre-create alert record (local)
3. Capture GPS location (if available)

On call button tap:

1. Open phone dialer: `Linking.openURL('tel:+17805551234')`
2. App goes to background
3. Log call initiation

On return from call:

1. Show optional note field
2. User adds note (or skips)
3. Auto-save note
4. Queue alert for sync

On sync:

1. POST alert to server
2. Server sends email to coordinator
3. Update sync status

## Code Example

```typescript
const AlertScreen = ({ route }) => {
  const { clientId } = route.params;
  const [alert, setAlert] = useState<Alert | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    createAlert();
  }, []);

  const createAlert = async () => {
    const location = await getLocation();
    const newAlert = {
      id: uuid(),
      caregiverId: currentUser.id,
      clientId,
      coordinatorId: coordinator.id,
      initiatedAt: new Date(),
      location,
      syncStatus: 'local',
    };
    await db.insert('alerts', newAlert);
    setAlert(newAlert);
  };

  const handleCall = async () => {
    HapticFeedback.trigger('impactHeavy');
    await Linking.openURL(`tel:${coordinator.phone}`);
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    debouncedSave(value);
  };

  const debouncedSave = useMemo(
    () => debounce(async (note) => {
      await db.update('alerts', alert.id, { note });
      queueSync(alert.id);
    }, 2000),
    [alert]
  );

  return (
    <Modal>
      <Text style={styles.title}>Something's Wrong</Text>
      <Text style={styles.body}>Call your coordinator immediately.</Text>
      <DestructiveButton
        label={`📞 Call ${coordinator.name}`}
        sublabel={coordinator.phone}
        onPress={handleCall}
      />
      <TextInput
        label="Add a note (optional)"
        value={note}
        onChange={handleNoteChange}
        multiline
        placeholder="e.g., Client confused, coordinator advised..."
      />
    </Modal>
  );
};
```

---

## Testing Checklist

- [ ] Emergency button always accessible
- [ ] Modal appears in <300ms
- [ ] Phone dialer opens immediately
- [ ] Alert logged in background
- [ ] Optional note saves
- [ ] Syncs to server
- [ ] Coordinator receives email
- [ ] Works offline (queues alert)

---

See other feature folders for Offline Sync and Onboarding.
