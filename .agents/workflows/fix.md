---
description: >
  Fix a specific bug or issue in FlowVault. Activates @qa to diagnose,
  @engineer to fix, @qa to verify. Use: /fix <description of issue>
---

# Fix Workflow

**Activate:** @qa first, then @engineer

Steps:
1. @qa: Reproduce the issue, identify root cause, affected files
2. @qa: Classify severity (P0=blocking, P1=degraded, P2=cosmetic)
3. @engineer: Fix the issue in the identified files
4. @engineer: Run `tsc --noEmit` and `npm run lint` after fix
5. @qa: Verify fix resolves issue and no regressions introduced
6. Report: file changed, lines changed, verification result
