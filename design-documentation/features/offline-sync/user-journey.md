# Offline Sync: User Journey

## Sarah Works in a Rural Area

8:00 AM – Sarah enters dead zone

Sarah drives to a rural area with no cell service. She has 3 visits scheduled.

What happens:

- App continues working normally
- All visits save to local SQLite
- Sync status shows "Saved locally" (gray cloud)
- No errors, no blocking

**What Sarah thinks:** "No signal, but the app still works."

---

11:30 AM – Sarah returns to town

Sarah finishes her rural visits and drives back to town. Her phone reconnects to WiFi.

What happens:

1. App detects network connection
2. Background sync triggers automatically
3. Sync status shows "Syncing..." (blue spinner)
4. 3 visits + 5 photos sync to server
5. After 30 seconds, status shows "Synced" (green checkmark)
6. No user action required

**What Sarah thinks:** "Everything synced automatically. Perfect."

---

## Edge Case: Sync Failure

**Scenario:** Server is down, sync fails.

What happens:

1. Sync attempt fails
2. Sync status shows "Sync failed" (red exclamation)
3. Error banner appears: "Sync failed. Will retry in 30 seconds."
4. Auto-retry with exponential backoff
5. After 5 attempts, shows "Tap to retry"
6. Sarah taps, sync succeeds

**What Sarah thinks:** "It kept trying. I didn't lose anything."

---

## Success Metrics

- Offline duration: Up to 7 days (auth grace period)
- Sync success rate: ≥99.5%
- Data loss: 0 incidents
- User confidence: "It just works"

---

See other files for screen states, interactions, accessibility, and implementation.
