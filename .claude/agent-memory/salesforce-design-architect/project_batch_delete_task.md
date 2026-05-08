---
name: Batch Delete Task Pattern
description: Batch + Schedulable pattern established for US-001 Task cleanup; naming conventions, architectural decisions, and test structure decided
type: project
---

US-001 established the standard pattern for scheduled bulk-delete operations on standard objects in this project.

**Class naming convention:**
- Batch class: `TaskCleanupBatch` (implements `Database.Batchable<SObject>`)
- Scheduler class: `TaskCleanupBatchScheduler` (implements `Schedulable`)
- Test class: `TaskCleanupBatchTest`

**Key architectural decisions:**
- No `with sharing` on the batch class — intentional, to ensure org-wide cleanup rather than owner-scoped
- `Database.QueryLocator` in `start()` — supports up to 50M records; no LIMIT in the QueryLocator query
- `Database.delete(scope, false)` — allOrNone = false prevents a single bad record from aborting a full chunk
- Cron expression `"0 0 3 * * ?"` — daily at 3:00 AM; the `?` in day-of-week is required by Salesforce cron parser
- `scheduleMe()` static convenience method on the Scheduler class — allows one-line re-registration from anonymous Apex
- Batch size: 200 (default; can be tuned down to 100 if Tasks have many related records)

**Test data pattern (3 categories required):**
1. Records matching BOTH filter criteria (should be deleted) — use `Date.today().addDays(-366)`
2. Records matching only Status (should survive — too recent) — use `Date.today().addDays(-100)`
3. Records matching only date (should survive — wrong status) — Status = 'Not Started', old ActivityDate

**Test method pattern:**
- Batch test: wrap `Database.executeBatch()` in `Test.startTest()` / `Test.stopTest()`; assert surviving count
- Scheduler test: call `scheduleMe()` inside start/stop test; assert `CronTrigger` count by job name

**Risk flags established:**
- Deletion is irreversible — always recommend data export before first production run
- Confirm `Status` picklist API value = "Completed" in target org before deployment
- `ActivityDate` is the correct aging field (not `CreatedDate`) per acceptance criteria — confirm with business

**Why:** Declarative Scheduled Flow cannot safely bulk-delete at scale (10K DML row limit per transaction). Database.Batchable with QueryLocator is the Well-Architected Framework-recommended pattern.

**How to apply:** Use this naming and structural pattern for any future scheduled bulk-delete or bulk-update batch jobs on standard or custom objects.
