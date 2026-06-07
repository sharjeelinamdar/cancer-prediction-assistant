# Hospital Finder

## Objective
Help users discover relevant care centers through a map-first experience integrated with project risk context.

## Technology
- Leaflet
- React Leaflet
- OpenStreetMap tiles

## UI Model
- Background map
- Overlay panel listing hospitals
- Search input for city/hospital filtering
- Risk toggles (`high`, `moderate`, `low`)
- Clickable hospital names opening modal details

## Recommendation Logic
- For `high` risk, oncology-specialized hospitals are prioritized.
- For other risk levels, full list remains available with rating ordering.
- Recommendation source is static and deterministic for demo reliability.

## Interaction Flow
1. User opens Hospital Finder route.
2. Map auto-fits visible hospitals.
3. User searches by city/name/specialization.
4. User clicks `Locate` to focus map.
5. User clicks hospital name to open detailed modal.

## Key Design Decisions
- **Static data first**: avoids API dependency in evaluations.
- **Map + overlay approach**: keeps geographic context visible at all times.
- **Modal details**: prevents route/context switching and preserves exploration flow.

## Current Limitations
- No real-time bed availability integration.
- No travel-time or distance matrix calculation.
- No external hospital API sync yet.
