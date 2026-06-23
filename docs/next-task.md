# Next Task

## Current task
Stabilize the Project Brief CRUD flow and align it with the one-brief-per-project model.

## Product goal
Allow the user to open a Project Brief, fill in the questionnaire, save it, and return to it later from the Projects table.

## What this next step should cover
The next implementation should focus on the brief path:

1. Load the correct ProjectBrief
2. Enforce one-brief-per-project from the Projects table
3. Save and update brief data reliably
4. Return saved briefs to the frontend list and edit views

## What should NOT be included in this step
Do not work on:
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
- where brief data is normalized for export or future features

## Output expectation
The next implementation should produce a clean backend-first brief flow for:
Project → Brief
