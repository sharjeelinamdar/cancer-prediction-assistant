from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def _get_reports_dir() -> Path:
    env_dir = os.getenv("STRUCTURED_REPORTS_DIR", "").strip()
    if env_dir:
        configured = Path(env_dir)
        if configured.is_absolute():
            target = configured
        else:
            project_root = Path(__file__).resolve().parents[3]
            target = project_root / configured
    else:
        project_root = Path(__file__).resolve().parents[3]
        target = project_root / "structured_reports"

    target.mkdir(parents=True, exist_ok=True)
    return target


def save_structured_report_json(data: dict, source: str) -> str:
    reports_dir = _get_reports_dir()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_source = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in source.lower())
    filename = f"{stamp}_{safe_source}_{uuid4().hex[:8]}.json"
    file_path = reports_dir / filename

    payload = {
        "saved_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "data": data,
    }

    file_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    return str(file_path)