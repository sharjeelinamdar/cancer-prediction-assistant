# Backend Documentation

## Backend Overview
The backend is built with FastAPI and is responsible for ingestion, OCR, structured extraction, analysis, and AI-backed responses.

## Technology
- FastAPI
- Pydantic
- Uvicorn
- python-multipart (file uploads)
- pytesseract + pdf2image + pypdf
- OpenCV + NumPy
- Groq SDK for LLM calls

## API Endpoints

### Health
- `GET /health`
- Purpose: service status check

### Chat
- `POST /chat`
- Purpose: general assistant response (non-report-specific)

### Upload
- `POST /upload-report`
- Input: multipart file (PDF/image)
- Output: extracted text

### Report Analysis
- `POST /report/analyze`
  - Uses extracted text (+ optional structured input)
  - Builds structured report, computes risk, generates summary

- `POST /report/structure`
  - Extraction + validation stage only
  - Returns structured parameters and saved JSON reference

- `POST /report/analyze-structured`
  - Interpretation stage from structured JSON only

- `POST /report/chat`
  - Report-aware Q&A using text + optional structured context

## File Upload Handling
- Validates content type and size limits
- Sanitizes file metadata
- Reads bytes and dispatches to OCR service

## Processing Pipeline
1. Validate input
2. Extract text (direct PDF text or OCR fallback)
3. Parse into structured parameters
4. Compute status (`low`/`normal`/`high`)
5. Generate risk and summary
6. Persist structured snapshot
7. Return normalized API response

## Error Handling Strategy
- Explicit `HTTPException` for validation/client errors
- Global exception handlers in `main.py`
- Consistent JSON response format (`detail` field)

## Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
