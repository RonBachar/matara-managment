# Next Task

## Current task
Prepare and implement the first real GPT 1 flow through the backend.

## Product goal
Allow the user to open a Project Brief and trigger:

Create Sitemap & Wireframe

through a real backend flow.

## What this next step should cover
The next implementation should focus only on the GPT 1 path:

1. Load the correct ProjectBrief
2. Build a normalized brief payload from the saved brief data
3. Send that payload through the backend GPT 1 flow
4. Save the GPT 1 result
5. Return the result to the frontend

## What should NOT be included in this step
Do not work on:
- GPT 2
- HTML generation
- Netlify deployment
- Leads
- Tasks
- Dashboard
- Broad cleanup
- Legacy brief migration work unless explicitly needed

## Expected implementation thinking
Before coding, inspect and confirm:

- how ProjectBrief is currently loaded and saved
- whether the one-brief-per-project rule is already enforced correctly
- what backend route should be used for Create Sitemap & Wireframe
- where normalized brief generation should live
- where GPT 1 output should be stored

## Output expectation
The next implementation should produce a clean backend-first GPT 1 flow for:
Project → Brief → GPT 1 → Sitemap/Wireframe
