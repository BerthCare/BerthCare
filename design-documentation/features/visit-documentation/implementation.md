# Visit Documentation: Implementation

## Component Mapping

**Screen:** `VisitScreen.tsx`
Components:

- `TapToEditRow` (custom, based on `forms.md`)
- `TextInput` (from `forms.md`)
- `PrimaryButton` (from `buttons.md`)
- `PhotoCapture` (custom, in-app camera)

## Data Flow

On screen load:

1. Query last visit from SQLite
2. Create new visit record (local only)
3. Copy last visit's documentation
4. Render pre-filled fields (gray text)
5. Set `startTime = now()`

On field edit:

1. Update in-memory state
2. Change text color to black
3. Add field to `changedFields` array
4. Debounce auto-save (2 seconds)

On auto-save:

1. Update SQLite (local)
2. Add to sync queue
3. Update sync indicator

On complete:

1. Set `endTime = now()`
2. Capture GPS location (if permission)
3. Mark schedule as completed
4. Queue for sync (high priority)
5. Navigate back to Today

## Code Example

```typescript
const VisitScreen = ({ route }) => {
  const { scheduleId, clientId } = route.params;
  const [visit, setVisit] = useState<Visit | null>(null);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  useEffect(() => {
    loadLastVisit();
  }, []);

  const loadLastVisit = async () => {
    const lastVisit = await db.query(
      'SELECT * FROM visits WHERE clientId = ? ORDER BY visitDate DESC LIMIT 1',
      [clientId]
    );

    const newVisit = {
      id: uuid(),
      scheduleId,
      clientId,
      visitDate: new Date(),
      startTime: new Date(),
      documentation: lastVisit?.documentation || {},
      copiedFromVisitId: lastVisit?.id,
      changedFields: [],
      syncStatus: 'local',
    };

    await db.insert('visits', newVisit);
    setVisit(newVisit);
  };

  const handleFieldChange = (field: string, value: string) => {
    setVisit(prev => ({
      ...prev,
      documentation: { ...prev.documentation, [field]: value },
    }));

    if (!changedFields.includes(field)) {
      setChangedFields(prev => [...prev, field]);
    }

    debouncedSave(field, value);
  };

  const debouncedSave = useMemo(
    () => debounce(async (field, value) => {
      await db.update('visits', visit.id, {
        documentation: visit.documentation,
        changedFields,
        updatedAt: new Date(),
      });
      queueSync(visit.id);
    }, 2000),
    [visit, changedFields]
  );

  const handleComplete = async () => {
    const location = await getLocation();
    await db.update('visits', visit.id, {
      endTime: new Date(),
      location,
      syncStatus: 'local',
    });
    await db.update('schedules', scheduleId, {
      status: 'completed',
      completedAt: new Date(),
    });
    queueSync(visit.id, 'high');
    navigation.goBack();
  };

  return (
    <ScrollView>
      <TapToEditRow
        label="Blood Pressure"
        value={visit.documentation.bloodPressure}
        onChange={(value) => handleFieldChange('bloodPressure', value)}
        isEdited={changedFields.includes('bloodPressure')}
      />
      {/* More fields... */}
      <PrimaryButton
        label="Complete Visit"
        onPress={handleComplete}
      />
    </ScrollView>
  );
};
```

---

## Testing Checklist

- [ ] Last visit pre-fills correctly
- [ ] Gray text for unchanged fields
- [ ] Black text for edited fields
- [ ] Auto-save after 2 seconds
- [ ] Swipe to complete works
- [ ] Photo capture works
- [ ] GPS captured on complete
- [ ] Syncs in background
- [ ] Works offline
- [ ] No data loss

---

See other feature folders for Emergency Alert, Offline Sync, and Onboarding.
