# System Architecture

## Purpose
This document explains how the AI-powered Cancer Virtual Assistant is structured end-to-end.

## High-Level View
The platform follows a staged pipeline so each responsibility is clear and testable.

1. Document ingestion (PDF/image upload)
2. OCR extraction (raw text generation)
3. Structured extraction (parameter + range parsing)
4. Validation and risk derivation
5. AI interpretation and chat generation
6. Frontend visualization and interaction

## Core Flow
```text
Upload Report -> OCR -> Structured Parsing -> Validation -> AI Summary/Chat -> Dashboard UI
```

## Component-Level Architecture

### Frontend (React + TypeScript)
- Handles user interaction, route navigation, and visual rendering.
- Calls backend APIs for upload, analysis, and report-aware chat.
- Stores lightweight state snapshots in localStorage for history and dashboard continuity.

### Backend (FastAPI)
- Exposes stateless API endpoints.
- Coordinates OCR, structured parsing, risk scoring, and AI prompts.
- Applies exception handling and consistent JSON error responses.

### AI Layer (Groq + fallback logic)
- Generates summaries and conversational answers.
- Uses structured prompts with section constraints.
- Falls back to deterministic rule-based outputs when model access is unavailable.

### Storage Layer
- Structured report JSON snapshots are persisted under `structured_reports/`.
- Client session/auth state is currently localStorage-based in frontend.

## Pipeline: OCR -> Extraction -> Validation -> AI -> UI

### 1) OCR
- Input: user-uploaded report.
- Strategy:
  - For PDFs, try direct text extraction first.
  - If direct extraction is weak, convert pages to images and OCR with Tesseract.

### 2) Extraction
- Line-level and regex-assisted parsing identifies lab parameters.
- Maps extracted values to known parameter aliases and plausible ranges.

### 3) Validation
- Status is computed per parameter:
  - `low` if value < min range
  - `high` if value > max range
  - `normal` otherwise

### 4) AI
- Structured JSON is sent into prompt templates for summary generation.
- Output format is normalized into `Key Findings`, `Abnormal Values`, and `Simple Explanation`.

### 5) UI
- Dashboard, report analysis, chat, hospital finder, and knowledge hub consume API outputs.
- Risk visibility and explainability are surfaced through cards, charts, and issue chips.

## Design Decisions
- **Staged architecture**: easier debugging and validation than a single black-box call.
- **Structured JSON first**: reduces hallucination and enables deterministic risk logic.
- **Fallback behavior**: app remains usable when AI providers or OCR fidelity fail.
- **Separation of concerns**: frontend focuses on UX; backend handles medical-data processing logic.
- **Extensible modules**: parameter specs and prompt templates can evolve without breaking routing.
