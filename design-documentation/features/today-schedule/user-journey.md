# Today Schedule: User Journey

## Sarah's Morning

**7:02 AM – Sarah opens BerthCare**

Sarah is in her car, about to start her day. She has 6 clients scheduled. She opens BerthCare to see who's first.

**What happens:**
1. App opens instantly (<1 second)
2. Today screen appears (no splash, no loading)
3. She sees 6 client cards, ordered by time
4. First card: Margaret Chen, 8:00 AM, 123 Oak St
5. Margaret's photo is visible (she recognizes her immediately)
6. Status shows "Upcoming" (gray clock icon)

**What Sarah thinks:** "Margaret is first. I have time for coffee."

---

**7:58 AM – Sarah arrives at Margaret's home**

Sarah parks outside Margaret's house. She opens BerthCare to start the visit.

**What happens:**
1. App opens to Today screen (still cached from earlier)
2. Margaret's card now shows "In Progress" (blue dot)
3. Sarah taps Margaret's card
4. Visit screen slides in (<300ms)
5. Last visit's notes are pre-filled (gray text)
6. Sarah is ready to document

**What Sarah thinks:** "Perfect. Last visit's notes are already here. I'll just update what changed."

---

**8:07 AM – Sarah completes the visit**

Sarah has updated Margaret's wound assessment and taken a photo. She's ready to move on.

**What happens:**
1. Sarah swipes up to complete visit
2. Haptic feedback (medium impact)
3. Visit screen slides out
4. Today screen reappears
5. Margaret's card now shows "Completed" (green checkmark)
6. Sync status shows "Syncing..." (blue spinner)
7. After 10 seconds, status changes to "Synced" (green checkmark)

**What Sarah thinks:** "Done. On to John."

---

**12:30 PM – Sarah checks her afternoon schedule**

Sarah is on lunch break. She wants to see who's left for the afternoon.

**What happens:**
1. She opens BerthCare
2. Today screen shows all 6 clients
3. First 3 cards show "Completed" (green checkmarks)
4. Last 3 cards show "Upcoming" (gray clocks)
5. She sees her next visit: Robert Lee, 1:00 PM

**What Sarah thinks:** "Three more visits. I'll be done by 4 PM."

---

**5:15 PM – Sarah finishes her day**

Sarah has completed all 6 visits. She opens BerthCare to confirm everything is synced.

**What happens:**
1. Today screen shows all 6 clients
2. All cards show "Completed" (green checkmarks)
3. Sync status shows "Synced" (green checkmark)
4. No unsynced visits

**What Sarah thinks:** "All done. No paperwork tonight."

---

## Edge Cases

### No Internet All Day

**Scenario:** Sarah works in a rural area with no cell service.

**What happens:**
1. All visits are saved locally (SQLite)
2. Sync status shows "Saved locally" (gray cloud)
3. When Sarah gets home and connects to WiFi, all visits sync automatically
4. Sync status changes to "Synced" (green checkmark)

**What Sarah thinks:** "It just works. I don't have to think about it."

---

### Emergency During Visit

**Scenario:** Margaret is unusually confused. Sarah needs help.

**What happens:**
1. Sarah taps emergency button (top-right, red ⚠)
2. Emergency modal appears
3. Sarah taps "Call Coordinator - Linda Chen"
4. Phone dialer opens with Linda's number
5. Sarah calls Linda, gets advice
6. After call, Sarah adds optional note: "Client confused, coordinator advised..."
7. Alert is logged and synced

**What Sarah thinks:** "I got help in seconds. No forms, no delays."

---

### Visit Cancelled

**Scenario:** John Smith cancels his visit.

**What happens:**
1. Coordinator (Linda) marks visit as cancelled in system
2. Sarah's app syncs in background
3. John's card disappears from Today screen
4. Sarah sees 5 cards instead of 6

**What Sarah thinks:** "One less visit. More time for the others."

---

## Success Metrics

This user journey succeeds if:
- Sarah finds her next visit in <3 seconds
- Sarah completes a visit in <60 seconds (documentation time)
- Sarah never wonders "Did it save?"
- Sarah never has to do paperwork at night
- Sarah says "I'd be upset if you took this away"

---

**Next:** Review `screen-states.md` for all possible screen states.
