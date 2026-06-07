# Knowledge Hub

## Purpose
Provide structured educational content so users can understand symptoms, prevention, and care pathways alongside AI outputs.

## Content System
- Static article dataset in frontend library
- Category-driven filtering
- Dedicated article detail view

## Category Structure
Examples include:
- Breast Cancer
- Lung Cancer
- Prostate Cancer
- Early Signs
- Prevention
- Lifestyle

## Rendering Flow
1. Knowledge route loads article list.
2. User filters by category.
3. User opens article detail route.
4. Article sections render as readable blocks (overview, causes, symptoms, prevention).

## AI Explanation Integration
Each article can hand off to chat with a prefilled prompt ("Explain in simple terms") to bridge static knowledge with conversational guidance.

## Why This Design
- static articles provide predictable evaluation behavior
- category filters improve discoverability
- chat handoff increases practical usefulness

## Scope Notes
- No CMS integration yet
- No admin authoring workflow yet
- Content is curated in code for project simplicity
