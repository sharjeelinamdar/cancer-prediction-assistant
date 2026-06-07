# OCR Pipeline

## Objective
Convert uploaded pathology/lab reports (PDF/images) into reliable text for downstream extraction.

## OCR Tools Used
- Tesseract OCR (`pytesseract`)
- Poppler (used by `pdf2image` for PDF page rendering)
- pypdf for direct text extraction when PDFs already contain text

## Pipeline Strategy

### Step 1: File-Type Aware Entry
- PDF input:
  - Try direct text extraction first (faster + cleaner).
  - If extracted text is too short, fallback to image-based OCR.
- Image input:
  - Decode bytes and run image OCR directly.

### Step 2: Preprocessing
The service applies preprocessing through `image_preprocess` before OCR to improve readability.
Typical goals include:
- noise reduction
- contrast improvements
- cleaner edges/text regions

### Step 3: OCR Execution
- Run Tesseract on processed page/image arrays
- Merge multi-page text
- Normalize output by trimming noisy empty lines

## Why This Hybrid Strategy
- Direct extraction is more accurate for digital PDFs.
- OCR fallback handles scanned or photo-based reports.
- Combining both improves robustness in real-world uploads.

## Challenges and Limitations
- Low-resolution scans can reduce OCR accuracy.
- Skewed photos and shadows introduce recognition errors.
- Complex report layouts (multi-column, dense tables) may reduce parsing quality.
- OCR quality directly affects structured extraction confidence.

## Operational Notes
- `TESSERACT_CMD` and `POPPLER_PATH` can be configured in `.env`.
- If no clear text is extracted, user receives a clear retry message.
