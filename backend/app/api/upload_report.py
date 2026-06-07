import os

from fastapi import APIRouter, File, UploadFile

from app.schemas.upload import UploadResponse
from app.services.file_validation import sanitize_filename, validate_size, validate_upload
from app.services.ocr_service import ocr_service

router = APIRouter(prefix="/upload-report", tags=["report"])


@router.post("", response_model=UploadResponse)
async def upload_report(file: UploadFile = File(...)) -> UploadResponse:
    max_mb = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    max_size_bytes = max_mb * 1024 * 1024

    validate_upload(file, max_size_bytes)
    _ = sanitize_filename(file.filename or "upload.bin")

    file_bytes = await file.read()
    validate_size(file_bytes, max_size_bytes)

    extracted_text = ocr_service.extract_text(file_bytes, file.content_type or "")
    return UploadResponse(extracted_text=extracted_text)
