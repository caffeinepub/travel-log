# Travel Log — Mobile-Optimised Layout

## Current State
- Two-column desktop layout (Log Trip form on left, Travel Log on right)
- On mobile, both columns stack vertically — fine, but the page is very long
- "Create Preset" button only appears when presets list is empty; once presets exist the only option is a tiny "Manage" button in the top-right corner of the presets section — easily missed/invisible on a phone
- Preset management dialog is a flat modal — the form and existing presets scroll together
- No bottom navigation; user must scroll to switch between logging a trip and viewing history
- Date filter inputs in the travel log are narrow on mobile

## Requested Changes (Diff)

### Add
- Bottom tab navigation bar (fixed to bottom of screen on mobile) with three tabs: "Log Trip", "History", and "Presets"
- A dedicated Presets tab/section that shows preset list AND a prominent "+ Create Preset" button, always visible regardless of how many presets exist
- On mobile, show only the active tab's content (single-panel view), avoiding the long scroll
- On desktop (lg+), retain the current two-column layout with presets integrated as before

### Modify
- The "Log Trip" section: move the Quick Presets row into the form as before, but add a clearly visible "+ Add Preset" link/button below the preset chips (not just in the manage dialog)
- The Presets modal: replace with a dedicated full Presets tab on mobile, showing a clean list of presets with delete buttons and a "+ Create Preset" form below
- Export CSV and date filter stay in the History tab
- The travel log table on mobile: simplify columns — hide "Departure" and "Note" columns on mobile (xs), show only Date, Destination, km, and Delete. User can expand an entry to see details if needed, but basic simplified view is sufficient
- Header: keep the logo and title, remove the subtitle text on mobile to save space

### Remove
- The "Manage" button next to the presets section header (replaced by the Presets tab)
- Separate preset management modal dialog (functionality moved inline to Presets tab)

## Implementation Plan
1. Add a `activeTab` state: 'log' | 'history' | 'presets'
2. On mobile (< lg breakpoint): render only the active tab's panel; hide bottom bar on desktop
3. On desktop (lg+): retain side-by-side layout, presets section embedded in Log Trip card as before, preset modal still available
4. Presets tab: full-width card with existing presets list (with delete confirm) and always-visible "+ Create Preset" form below
5. Log Trip tab: keep Quick Presets chips; add a small "+ New Preset" button below chips so users can add one without leaving the tab
6. History tab: keep the travel log table, date filter, and export button; simplify mobile columns
7. Bottom nav bar: fixed at bottom on mobile only, with icons + labels for Log, History, Presets tabs; highlight active tab in forest green
8. Remove now-redundant preset management Dialog component
