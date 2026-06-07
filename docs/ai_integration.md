# AI Integration

## Model Provider
- Groq API
- Configurable model via `GROQ_MODEL` (default set in backend)

## AI Use Cases in Project
1. General chat assistant (`/chat`)
2. Report summary generation (`/report/analyze`, `/report/analyze-structured`)
3. Report-aware follow-up Q&A (`/report/chat`)

## Prompt Engineering Strategy
Prompts are constrained to:
- plain and clear language
- no diagnosis or prescriptions
- mandatory sectioned outputs for summaries
- concise response length limits

For report summaries, prompts require:
- `Key Findings`
- `Abnormal Values`
- `Simple Explanation`

## Why Structured JSON Is Used
Instead of only raw OCR text, structured parameter JSON is used whenever possible because it:
- reduces ambiguity
- makes value/range context explicit
- lowers hallucination risk
- allows post-processing validation

## Hallucination Control Mechanisms
- strict prompt constraints
- section enforcement in backend (`_enforce_report_sections`)
- fallback deterministic summary builders
- abnormal-only payload focus for report chat

## Fallback and Reliability
If Groq key is unavailable or API fails:
- backend switches to rule-based fallback responses
- disclaimers are still appended
- user experience remains functional

## Safety Layer
All chat/report responses include medical disclaimer intent:
- informative assistance only
- encourages consulting qualified doctors for diagnosis/treatment

## Chat + Summary Flow

### Summary Flow
`structured_data -> prompt template -> LLM output -> section enforcement -> API response`

### Report Chat Flow
`question + abnormal context (+ report text fallback) -> concise response -> disclaimer`
