---
name: Branch History - SFClaudeRepo
description: Record of feature branches created for Prasanthikand/SFClaudeRepo, including component sets and conventions observed
type: project
---

Feature branches created for Prasanthikand/SFClaudeRepo:

| Branch | Date | Components | Notes |
|--------|------|------------|-------|
| feature/delete-stale-tasks-batch-20260503 | 2026-05-03 | DeleteStaleTasksBatch.cls, DeleteStaleTasksScheduler.cls, DeleteStaleTasksBatchTest.cls (+ meta.xml files), dreamhouse.permissionset-meta.xml | Stale Task cleanup batch job, daily 3AM scheduler, 6-method test class, permission set class access entries |

**Why:** Track which components have been branched to avoid duplication and provide history of deployed changes.
**How to apply:** Before creating a new branch, check this list to see if a similar branch already exists or if the components were previously deployed.

## Conventions observed

- Branch naming: `feature/<short-description>-YYYYMMDD` (kebab-case, date suffix)
- Apex classes are always committed with their `.cls-meta.xml` pair in the same commit
- Permission set updates are committed in a separate follow-up commit after the Apex commit
- Base branch: `main`
- API Version in use: 64.0
- Prettier config: 4-space tabs, single quotes, no trailing commas
- Previously merged branch: `DevBranch` → `main` (PR #1, closed 2026-05-03)
