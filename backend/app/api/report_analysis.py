from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas.report import (
    ReportAnalyzeRequest,
    ReportAnalyzeResponse,
    ReportChatRequest,
    ReportChatResponse,
    StructuredAnalyzeRequest,
    StructuredBuildRequest,
    StructuredBuildResponse,
)
from app.services.structured_report_store import save_structured_report_json
from app.services.ai_service import ai_service
from app.services.structured_report_service import build_structured_report

router = APIRouter(prefix="/report", tags=["report-analysis"])


HIGH_RISK_TERMS = {"tumor", "malignant", "high", "elevated"}
MODERATE_RISK_TERMS = {"borderline", "slightly high"}
IMPORTANT_TERMS = {
    "high",
    "low",
    "elevated",
    "tumor",
    "abnormal",
    "hemoglobin",
    "wbc",
    "platelets",
    "markers",
}


def _collect_matches(text: str, terms: set[str]) -> list[str]:
    lowered = text.lower()
    return [term for term in sorted(terms) if term in lowered]


def _assess_risk(text: str, structured_data: dict | None = None) -> tuple[str, list[str]]:
    if structured_data:
        high_params = [name for name, param in structured_data.items() if param.status == "high"]
        low_params = [name for name, param in structured_data.items() if param.status == "low"]

        if high_params:
            reasons = [f"Parameter '{name}' is high compared to its reference range." for name in sorted(high_params)]
            return "High", reasons

        if low_params:
            reasons = [f"Parameter '{name}' is low compared to its reference range." for name in sorted(low_params)]
            return "Moderate", reasons

        return "Low", ["All parsed structured parameters are within their reference ranges."]

    high_matches = _collect_matches(text, HIGH_RISK_TERMS)
    if high_matches:
        reasons = [f"Found keyword '{term}' in report text." for term in high_matches]
        return "High", reasons

    moderate_matches = _collect_matches(text, MODERATE_RISK_TERMS)
    if moderate_matches:
        reasons = [f"Found keyword '{term}' in report text." for term in moderate_matches]
        return "Moderate", reasons

    return "Low", ["No high-risk or moderate-risk keywords were detected."]


@router.post("/analyze", response_model=ReportAnalyzeResponse)
def analyze_report(request: ReportAnalyzeRequest) -> ReportAnalyzeResponse:
    text = (request.extracted_text or "").strip()

    try:
        structured_data = build_structured_report(text, request.structured_data)
        summary = ai_service.generate_structured_report_summary(structured_data)
        risk_level, risk_reasons = _assess_risk(text, structured_data)
        saved_file = save_structured_report_json(
            {key: value.model_dump() for key, value in structured_data.items()},
            source="report-analyze",
        )
        highlighted_keywords = sorted(
            {
                *_collect_matches(text, IMPORTANT_TERMS),
                *structured_data.keys(),
                *{param.status for param in structured_data.values()},
            }
        )

        return ReportAnalyzeResponse(
            summary=summary,
            risk_level=risk_level,
            risk_reasons=risk_reasons,
            highlighted_keywords=highlighted_keywords,
            structured_data=structured_data or None,
            saved_file=saved_file,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze report at this time.",
        ) from exc


@router.post("/chat", response_model=ReportChatResponse)
def chat_about_report(request: ReportChatRequest) -> ReportChatResponse:
    report_text = request.extracted_text.strip()
    question = request.question.strip()
    structured_data = build_structured_report(None, request.structured_data) if request.structured_data else None

    if not report_text or not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both extracted report text and a question are required.",
        )

    try:
        answer = ai_service.generate_report_chat_response(
            report_text=report_text,
            question=question,
            structured_data=structured_data,
        )
        return ReportChatResponse(response=answer)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate report chat response at this time.",
        ) from exc


@router.post("/structure", response_model=StructuredBuildResponse)
def build_structured_data(request: StructuredBuildRequest) -> StructuredBuildResponse:
    text = request.extracted_text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted report text is required.",
        )

    try:
        structured_data = build_structured_report(text, None)
        if not structured_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract structured parameters from report text.",
            )

        saved_file = save_structured_report_json(
            {key: value.model_dump() for key, value in structured_data.items()},
            source="report-structure",
        )
        return StructuredBuildResponse(structured_data=structured_data, saved_file=saved_file)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to build structured report data at this time.",
        ) from exc


@router.post("/analyze-structured", response_model=ReportAnalyzeResponse)
def analyze_structured_report(request: StructuredAnalyzeRequest) -> ReportAnalyzeResponse:
    try:
        structured_data = build_structured_report(None, request.structured_data)
        summary = ai_service.generate_structured_report_summary(structured_data)
        risk_level, risk_reasons = _assess_risk("", structured_data)
        saved_file = save_structured_report_json(
            {key: value.model_dump() for key, value in structured_data.items()},
            source="report-analyze-structured",
        )
        highlighted_keywords = sorted({*structured_data.keys(), *{param.status for param in structured_data.values()}})

        return ReportAnalyzeResponse(
            summary=summary,
            risk_level=risk_level,
            risk_reasons=risk_reasons,
            highlighted_keywords=highlighted_keywords,
            structured_data=structured_data,
            saved_file=saved_file,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze structured report data at this time.",
        ) from exc