---
description: >
  Add a new workflow template to FlowVault's built-in library.
  Use: /addworkflow <name> <category> <price> <description>
  Example: /addworkflow "Slack Digest Bot" "Team Ops" "$29" "Daily AI summary of Slack channels"
---

# Add Workflow Template

**Activate:** @engineer

Steps:
1. Read `src/types/workflow.ts` to understand the Workflow interface
2. Read `.agents/skills/frontend-design/SKILL.md` for color/step conventions
3. Create a new workflow object matching the Workflow type:
   - Assign appropriate step types (trigger, fetch, transform, decision, action, output)
   - Use realistic durations (300–2000ms per step)
   - Use realistic sample data (no real credentials)
   - Pick integrations relevant to the workflow
4. Add to the `WORKFLOWS` array in `src/data/workflows.ts`
5. Run `tsc --noEmit` to confirm no type errors
6. Report: workflow added, step count, total duration, integrations

Step type selection guide:
- trigger: the event that starts the workflow
- fetch: any HTTP call to external API
- transform: data processing, formatting, scoring
- decision: if/else branch point
- action: writes data, sends message, creates record
- output: final state, summary
