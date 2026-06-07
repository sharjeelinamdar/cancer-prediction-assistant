from __future__ import annotations

import io
import os
from typing import Iterable

import cv2
import numpy as np
import pytesseract
from fastapi import HTTPException, status
from pdf2image import convert_from_bytes
from pypdf import PdfReader

from app.services.image_preprocess import preprocess_image


class OCRService:
    def __init__(self) -> None:
        tesseract_cmd = os.getenv("TESSERACT_CMD", "").strip()
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        self.poppler_path = os.getenv("POPPLER_PATH", "").strip() or None

    def extract_text(self, file_bytes: bytes, content_type: str) -> str:
        if content_type == "application/pdf":
            direct_text = self._extract_text_from_pdf_direct(file_bytes)
            if len(direct_text.strip()) >= 50:
                text = direct_text
            else:
                pages = self._pdf_to_arrays(file_bytes)
                text = self._extract_text_from_arrays(pages)
        else:
            image = self._bytes_to_array(file_bytes)
            text = self._extract_text_from_arrays([image])

        normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        if not normalized:
            return "No clear text could be extracted from this report. Try a clearer scan or photo."
        return normalized

    def _extract_text_from_pdf_direct(self, file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            chunks: list[str] = []
            for page in reader.pages:
                chunks.append((page.extract_text() or "").strip())
            return "\n".join(chunks)
        except Exception:
            return ""

    def _pdf_to_arrays(self, file_bytes: bytes) -> list[np.ndarray]:
        try:
            pages = convert_from_bytes(file_bytes, poppler_path=self.poppler_path, dpi=220)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Could not read PDF with OCR conversion. Ensure the file is valid and Poppler is installed "
                    "or set POPPLER_PATH in backend .env."
                ),
            ) from exc

        arrays: list[np.ndarray] = []
        for page in pages:
            rgb = np.array(page)
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            arrays.append(bgr)
        return arrays

    def _bytes_to_array(self, file_bytes: bytes) -> np.ndarray:
        file_array = np.frombuffer(file_bytes, dtype=np.uint8)
        image = cv2.imdecode(file_array, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not decode uploaded image.",
            )
        return image

    def _extract_text_from_arrays(self, images: Iterable[np.ndarray]) -> str:
        chunks: list[str] = []
        for image in images:
            processed = preprocess_image(image)
            text = pytesseract.image_to_string(processed)
            chunks.append(text)
        return "\n".join(chunks)


ocr_service = OCRService()
