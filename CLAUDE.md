# OS 2026 TV Schedule Timeline

## Overview
Web app visualizing Swedish SVT/TV4 broadcast schedule for 2026 Winter Olympics as a horizontal timeline with overlapping streams and highlighted finals.

## Tech Stack
- Vite + vanilla TypeScript, no UI framework
- CSS custom properties for dark/light theming
- Static JSON data, no backend

## Key Rules
- **XSS safety**: Always use `textContent` + `createElement()`, never `innerHTML` with data
- **UI language**: Swedish throughout
- **Swedish flag** 🇸🇪: Show on events where Sweden competes (via `hasSweden` field in JSON)

## File Structure
```
src/data/types.ts, process.ts, index.ts   — data layer
src/ui/main.ts, timeline.ts, navigation.ts, filters.ts, tooltip.ts, theme.ts — UI
src/styles/variables.css, layout.css, timeline.css, components.css — styles
index.html, schedule-data.json
```

## Data Model
- `RawScheduleEntry`: date, start, end, sport, event, channel, isFinal, hasSweden
- `ScheduleEntry`: adds id, startMinutes, endMinutes, durationMinutes, isGeneral, lane, hasSweden
- Cross-midnight: if end <= start, endMinutes += 1440
- Lane assignment: greedy interval scheduling, General events pinned to top lanes

## Design
- Dark mode default, 18 sport colors, finals get gold border + glow pulse
- General/OS-studion: pinned sticky row, opacity 0.35
- Responsive: 120px/hr desktop, 80px tablet, 60px mobile
- Finals summary card above timeline, finals count badges on date pills
