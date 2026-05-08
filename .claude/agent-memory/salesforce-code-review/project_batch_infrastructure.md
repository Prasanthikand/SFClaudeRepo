---
name: Batch Infrastructure - Task Cleanup Batch (US-001)
description: Architectural decisions, approved patterns, and review notes for the stale Task cleanup batch job (TaskCleanupBatch / TaskCleanupBatchScheduler)
type: project
---

TaskCleanupBatch + TaskCleanupBatchScheduler were introduced as a scheduled housekeeping feature for US-001. Key approved decisions reviewed 2026-05-07:

- `TaskCleanupBatch` intentionally omits `with sharing` — documented in class header. System-level cleanup must bypass record visibility to process Tasks owned by all users. This is the accepted pattern for org-wide housekeeping batches.
- `TaskCleanupBatchScheduler` uses `with sharing` — appropriate because it only invokes `Database.executeBatch()` and does not query data itself.
- `Database.Stateful` is implemented on `TaskCleanupBatch` to accumulate `failedDeleteCount` across chunks for finish()-time reporting.
- `Database.delete(scope, false)` (partial success / allOrNone=false) is the approved DML pattern in execute().
- SOQL filter: `Status = 'Completed' AND ActivityDate < :cutoffDate` (cutoffDate = today - 365 days). No LIMIT applied — full result set chunked by the batch framework via QueryLocator (supports up to 50M records).
- Batch size of 200 defined as `BATCH_SIZE` constant in the scheduler.
- Cron expression `'0 0 3 * * ?'` is correct for daily 3:00 AM execution.
- `scheduleMe()` convenience method is a static utility on the scheduler — reviewed and accepted.

**Test class (TaskCleanupBatchTest) approved patterns:**
- Uses `@TestSetup` for shared data: 3 eligible, 2 recent-completed, 2 old-not-started Tasks (7 total).
- Three test methods cover: happy-path deletion, non-eligible record preservation, and scheduler registration.
- Fourth method (`testSchedulerExecuteDispatchesBatch`) covers the scheduler's `execute()` method body via `System.schedule` + `Test.stopTest()`.
- `Assert.areEqual` (modern assertion API) used throughout — accepted.
- Warning: `testSchedulerExecuteDispatchesBatch` uses `Assert.isTrue(true, ...)` as its only assertion — trivially passes with no behavioral verification.
- Warning: `failedDeleteCount` stateful field has no `@TestVisible` accessor; its value is never asserted in tests.
- Warning: `finish()` method body is empty — intentional extensibility hook, documented.

**Why:** Nightly housekeeping; runs at 3AM via cron '0 0 3 * * ?'.

**How to apply:** When reviewing future changes, verify the without-sharing justification on the batch class is still valid. Flag any new test methods that use `Assert.isTrue(true)` as a trivial pass. Remind developer to add `@TestVisible` and a counter assertion if `failedDeleteCount` behavior ever needs to be validated.
