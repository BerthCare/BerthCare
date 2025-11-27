# Visit Documentation: Screen States

## Default State (Pre-filled)

Last visit's notes are pre-filled (gray text). Sarah only edits what changed.

**Layout:**
```
┌─────────────────────────────────────┐
│ < Today    [Saved locally]     ⚠    │
├─────────────────────────────────────┤
│ Margaret Chen                       │ ← 28pt Bold
│ [16pt space]                        │
│ Documentation                       │ ← 22pt Semibold
│ [16pt space]                        │
│ Blood Pressure                      │ ← Label
│ 120/80                              │ ← Gray (unchanged)
│ [16pt space]                        │
│ Wound Assessment                    │
│ 3cm, moderate drainage              │ ← Gray (unchanged)
│ [16pt space]                        │
│ Medications                         │
│ All meds taken                      │ ← Gray (unchanged)
│ [24pt space]                        │
│ ┌─────────────────────────────────┐ │
│ │     Complete Visit              │ │ ← Primary button
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Editing State

Field is focused, keyboard open, text is black (edited).

---

## Empty State (First Visit)

No previous visit. All fields are empty with placeholders.

---

## Syncing State

Visit is syncing to server. Sync indicator shows "Syncing..."

---

## Error State

Sync failed. Error banner shows "Sync failed. Will retry."

---

**See implementation.md for complete state management details.**
