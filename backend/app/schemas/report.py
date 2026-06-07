from typing import Literal

from pydantic import BaseModel, Field, model_validator


class StructuredParameterInput(BaseModel):
    value: float
    range: tuple[float, float]
    status: str | None = None


class StructuredParameter(BaseModel):
    value: float
    range: tuple[float, float]
    status: Literal["low", "normal", "high"]
    confidence: Literal["high", "medium", "low"]


class ReportAnalyzeRequest(BaseModel):
    extracted_text: str | None = Field(default=None, max_length=50000)
    structured_data: dict[str, StructuredParameterInput] | None = None

    @model_validator(mode="after")
    def validate_input_sources(self) -> "ReportAnalyzeRequest":
        text = (self.extracted_text or "").strip()
        if not text and not self.structured_data:
            raise ValueError("Either extracted_text or structured_data is required.")
        return self


class ReportAnalyzeResponse(BaseModel):
    summary: str
    risk_level: str
    risk_reasons: list[str]
    highlighted_keywords: list[str]
    structured_data: dict[str, StructuredParameter] | None = None
    saved_file: str | None = None


class StructuredBuildRequest(BaseModel):
    extracted_text: str = Field(..., min_length=1, max_length=50000)


class StructuredBuildResponse(BaseModel):
    structured_data: dict[str, StructuredParameter]
    saved_file: str


class StructuredAnalyzeRequest(BaseModel):
    structured_data: dict[str, StructuredParameterInput]


class ReportChatRequest(BaseModel):
    extracted_text: str = Field(..., min_length=1, max_length=50000)
    question: str = Field(..., min_length=1, max_length=2000)
    structured_data: dict[str, StructuredParameterInput] | None = None


class ReportChatResponse(BaseModel):
    response: str