from pathlib import Path

from fastapi import HTTPException, UploadFile, status

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
ALLOWED_PDF_TYPES = {"application/pdf"}
ALLOWED_CONTENT_TYPES = ALLOWED_IMAGE_TYPES.union(ALLOWED_PDF_TYPES)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}


def sanitize_filename(filename: str) -> str:
    if not filename:
        return "upload.bin"
    safe = Path(filename).name
    return safe.replace(" ", "_")


def validate_upload(file: UploadFile, max_size_bytes: int) -> None:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Use PDF or image files.",
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix and suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file extension. Use .pdf, .png, .jpg, .jpeg, .webp.",
        )

    if max_size_bytes <= 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server upload limit is misconfigured.",
        )


def validate_size(file_bytes: bytes, max_size_bytes: int) -> None:
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size is {max_size_bytes // (1024 * 1024)} MB.",
        )
