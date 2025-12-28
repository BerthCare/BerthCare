# Onboarding: Implementation

## Contextual Hints Management

**Storage:** Local preferences (AsyncStorage or SharedPreferences)

Code example:

```typescript
const showHintOnce = async (hintKey: string, message: string) => {
  const hasShown = await AsyncStorage.getItem(`hint_${hintKey}`);
  
  if (!hasShown) {
    showHint(message); // Fade in, stay 3s, fade out
    await AsyncStorage.setItem(`hint_${hintKey}`, 'true');
  }
};

// Usage
useEffect(() => {
  showHintOnce('today_tap_client', 'Tap a client to start documenting');
}, []);
```

---

## Empty State Components

EmptyState.tsx:

```typescript
interface EmptyStateProps {
  icon: string; // SF Symbol or Material Icon
  title: string;
  message: string;
}

const EmptyState = ({ icon, title, message }: EmptyStateProps) => (
  <View style={styles.container}>
    <Icon name={icon} size={64} color={colors.neutral[400]} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);
```

---

## Testing Checklist

- [ ] Login works with invitation code
- [ ] First visit shows empty fields with placeholders
- [ ] Contextual hints appear once, never again
- [ ] Empty states are helpful
- [ ] No tutorial screens
- [ ] Sarah can document first visit in <10 minutes

---

This completes the feature documentation. See accessibility folder for complete accessibility guidelines.
