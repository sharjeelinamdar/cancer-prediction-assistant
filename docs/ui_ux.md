# UI/UX Documentation

## Design Philosophy
The UI is designed as a clinical intelligence interface, not a generic dashboard.

Goals:
- trust and clarity
- fast comprehension of risk
- actionable interaction paths

## Visual Hierarchy
- Primary focus: risk status and report interpretation
- Secondary focus: recommended next interactions (chat, hospital finder, knowledge)
- Tertiary focus: historical and supporting information

## Interaction Patterns
- Progressive disclosure (overview -> detail)
- Card-based grouping for readable scanning
- Contextual actions near data (e.g., locate hospital, explain article)

## Motion and Feedback
Current approach uses lightweight CSS animation for:
- marker emphasis
- chart pulse cues
- loading/attention transitions

Why this choice:
- keeps UI responsive
- avoids heavy animation dependencies
- aligns with serious clinical tone

## Responsive Design
- Sidebar + top navigation on larger screens
- compact menu flow for mobile
- route-level pages adapt to small widths and constrained heights

## User Flow
1. Authenticate (Login/Signup)
2. Upload report
3. Review structured interpretation + risk
4. Ask follow-up in chat
5. Explore hospitals and educational content

## UX Decision Rationale
- **Simple language** improves accessibility for non-technical users.
- **Consistent sectioning** reduces cognitive load.
- **Explainability-first outputs** build user trust.
