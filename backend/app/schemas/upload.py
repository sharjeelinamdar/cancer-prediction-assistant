from pydantic import BaseModel


class UploadResponse(BaseModel):
    extracted_text: str
