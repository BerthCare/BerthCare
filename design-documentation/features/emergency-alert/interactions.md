# Emergency Alert: Interactions

## Tap Emergency Button

**Trigger:** Tap red ⚠ button (top-right)

**Behavior:**
1. Haptic heavy impact (urgent)
2. Modal slides up (300ms)
3. Focus moves to "Call Coordinator" button

---

## Tap Call Coordinator

**Trigger:** Tap "Call Coordinator" button

**Behavior:**
1. Haptic heavy impact
2. Phone dialer opens with coordinator's number
3. App goes to background
4. Alert logged in background

---

## Add Note (Optional)

**Trigger:** Return to app after call

**Behavior:**
1. Optional note field appears
2. User can type note or skip
3. Auto-saves after 2 seconds
4. Syncs in background

---

**See implementation.md for code examples.**
