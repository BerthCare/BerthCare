# Visit Documentation: User Journey

## Sarah Documents a Visit

**8:05 AM – Sarah opens Margaret's visit**

Sarah taps Margaret's card on the Today screen. The Visit screen appears instantly.

**What she sees:**
- Screen title: "Margaret Chen"
- Last visit's notes, pre-filled (gray text):
  - Blood Pressure: 120/80
  - Wound: 3cm, moderate drainage
  - Medications: All meds taken
  - Notes: Client in good spirits
- All fields are gray (unchanged)
- "Complete Visit" button at bottom

**What Sarah thinks:** "Perfect. Last visit's notes are here. I'll just update the wound."

---

**8:06 AM – Sarah edits the wound assessment**

Sarah taps the "Wound" field. It transforms into an editable input.

**What happens:**
1. Field border appears (blue)
2. Keyboard opens
3. Cursor appears at end of text
4. Sarah edits: "3cm, moderate drainage" → "2.5cm, minimal drainage"
5. Text turns black (indicates edit)
6. Sarah taps "Done" on keyboard
7. Field transforms back to row
8. Auto-save triggers (2 seconds later)
9. Sync status shows "Saved locally"

**What Sarah thinks:** "Done. It saved automatically."

---

**8:07 AM – Sarah takes a photo**

Sarah taps "Add Photo" button. In-app camera opens.

**What happens:**
1. Camera opens (full screen)
2. Sarah takes photo of wound
3. Photo compresses automatically (<500KB)
4. Photo encrypts automatically
5. Photo appears in visit (thumbnail)
6. Auto-save triggers
7. Photo queued for upload

**What Sarah thinks:** "Photo captured. Moving on."

---

**8:07 AM – Sarah completes the visit**

Sarah swipes up on the "Complete Visit" button.

**What happens:**
1. Haptic feedback (medium impact)
2. Visit screen slides out (300ms)
3. Today screen appears
4. Margaret's card shows "Completed" (green checkmark)
5. Sync status shows "Syncing..."
6. After 10 seconds: "Synced"

**What Sarah thinks:** "30 seconds. Done. On to the next visit."

---

## Success Metrics

- Documentation time: ≤60 seconds (from 15 minutes)
- Fields edited: 1-3 per visit (not all fields)
- Auto-save success: 100%
- Data loss: 0 incidents

---

**See other files for screen states, interactions, accessibility, and implementation details.**
