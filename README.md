# OncoAssist - AI-Powered Cancer Virtual Assistant

## Project Description
OncoAssist is a full-stack assistant that helps users interpret medical reports through a staged pipeline:

1. OCR text extraction from uploaded reports (PDF/images)
2. Structured parameter extraction with validation
3. Risk derivation and AI-generated summary
4. Report-aware conversational support
5. Feature-rich UI modules (Dashboard, Knowledge Hub, Hospital Finder)

This architecture is designed for clarity, explainability, and final-year project evaluation standards.

## Key Features
- OCR-enabled report ingestion
- Structured data extraction (value, range, status, confidence)
- AI summary with sectioned output (`Key Findings`, `Abnormal Values`, `Simple Explanation`)
- Report-aware and general chat assistants
- Clinical-style dashboard and report history
- Knowledge Hub with category-based educational articles
- Hospital Finder with interactive map overlays
- Authentication UI (login/signup with session guard)

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- React Router
- Chart.js
- Leaflet (react-leaflet)

### Backend
- FastAPI + Pydantic
- Uvicorn
- OCR: pytesseract, pdf2image, pypdf, OpenCV
- AI: Groq API (with deterministic fallback logic)

## System Flow Overview

```text
Upload Report
  -> OCR (direct PDF text or image OCR fallback)
  -> Structured Extraction (regex + line parsing)
  -> Validation (low/normal/high)
  -> AI Interpretation (summary/chat)
  -> UI Rendering (dashboard/chat/history/maps/knowledge)
```

## Screenshots / UI Overview
The project includes these major UI experiences:
- Login / Signup screens
- Dashboard with risk and insights
- Report analysis and explainability
- Chat assistant
- Knowledge Hub (article explorer)
- Hospital Finder (map + overlay + modal)

Add your screenshots under `frontend/public/` and reference them here as needed.

## Installation Steps

### 1) Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Required environment values:
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional override)
- `TESSERACT_CMD` (if not in PATH)
- `POPPLER_PATH` (if not in PATH)

### 2) Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Production build:
```bash
npm run build
```

## Folder Structure

```text
OncoAssist/
|- backend/
|  |- app/
|  |  |- api/
|  |  |- schemas/
|  |  |- services/
|  |  \- main.py
|  \- requirements.txt
|- frontend/
|  |- src/
|  |  |- pages/
|  |  |- lib/
|  |  \- App.tsx
|  \- package.json
|- structured_reports/
\- docs/
   |- architecture.md
   |- frontend.md
   |- backend.md
   |- ocr_pipeline.md
   |- data_extraction.md
   |- ai_integration.md
   |- features.md
   |- ui_ux.md
   |- hospital_finder.md
   |- knowledge_hub.md
   \- future_scope.md
```

## Detailed Documentation Index

- [Architecture](docs/architecture.md)
- [Frontend](docs/frontend.md)
- [Backend](docs/backend.md)
- [OCR Pipeline](docs/ocr_pipeline.md)
- [Data Extraction](docs/data_extraction.md)
- [AI Integration](docs/ai_integration.md)
- [Features](docs/features.md)
- [UI/UX](docs/ui_ux.md)
- [Hospital Finder](docs/hospital_finder.md)
- [Knowledge Hub](docs/knowledge_hub.md)
- [Future Scope](docs/future_scope.md)
