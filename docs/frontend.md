# Frontend Documentation

## Frontend Stack
- React 19
- TypeScript
- React Router
- Tailwind CSS
- Chart.js + react-chartjs-2
- Leaflet + react-leaflet

Note: Motion effects are currently implemented with CSS keyframes. Framer Motion can be added later for advanced orchestration.

## Application Structure
`src/` is organized by feature-focused pages and shared libraries.

- `pages/`: screen-level views (Dashboard, Upload, Chat, History, Knowledge Hub, Hospital Finder, Auth pages)
- `lib/`: shared utilities and data modules (`auth`, report history, static content)
- `components/`: reusable UI primitives
- `App.tsx`: route shell, sidebar/top-nav, auth guard logic

## Routing System
Primary routes:
- `/login` and `/signup` for authentication UI
- `/dashboard`
- `/analyze`
- `/chat`
- `/history`
- `/knowledge`
- `/knowledge/:articleId`
- `/hospitals`

Guard behavior:
- Unauthenticated users are redirected to `/login`.
- Authenticated users access the application shell and all feature routes.

## State Management Approach
The project uses React hooks and lightweight localStorage persistence.

- Component state: `useState`, `useMemo`, `useEffect`
- Session/auth: localStorage session object
- Report snapshots/history: localStorage-backed helper modules

Why this approach:
- Fast implementation for final-year project scope
- Minimal boilerplate
- Easy to migrate later to Context/Redux/Zustand if scale grows

## UI Design Principles
- Clinical tone over entertainment styling
- Clear hierarchy for risk communication
- Information density balanced with readability
- Mobile-first responsive adaptations

## Error Handling in Frontend
- Form-level validation messages for auth pages
- Graceful empty states (for hospital search, filtered lists, no report data)
- API fallback messaging from backend when OCR/AI are unavailable

## Build and Run
```bash
cd frontend
npm install
npm run dev
```
Production build:
```bash
npm run build
```
