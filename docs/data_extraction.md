# Data Extraction and Structuring

## Objective
Transform noisy OCR text into structured, validated medical parameters that can be interpreted consistently.

## Approach Summary
- Line-based parsing
- Regex-based value/range discovery
- Alias matching against known parameters
- Plausibility checks to reject unlikely numeric matches

## Parameter Model
Each extracted parameter is normalized into:

```json
{
  "parameter_name": {
    "value": 13.2,
    "range": [12.0, 16.0],
    "status": "normal",
    "confidence": "high"
  }
}
```

## Parsing Strategy

### 1) Line Matching
- Input text split into normalized lines.
- Each line checked against parameter aliases (e.g., WBC, platelet count, HbA1c).

### 2) Regex Extraction
- Range pattern: detects `min-max` or `min to max`.
- Number pattern: identifies candidate numeric values.
- Candidate scoring prefers sensible numeric positions and plausible magnitudes.

### 3) Validation Logic
For each parameter:
- `low` if value < range minimum
- `high` if value > range maximum
- `normal` otherwise

Confidence is assigned based on range presence and value plausibility.

## Handling Incorrect Mappings
To reduce false matches, the extractor applies:
- plausible min/max constraints per parameter type
- exclusion of numbers that belong to the range itself
- near-range heuristics and scoring instead of first-match selection

## Structured Input Path
The backend also supports direct structured input (`/report/analyze-structured`) where values are already known; it validates and normalizes status consistently.

## Why Structured JSON Matters
- Enables deterministic risk logic
- Improves explainability
- Makes AI prompts safer and less hallucination-prone
- Supports saved snapshots and reproducible analysis
