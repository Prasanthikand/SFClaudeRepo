---
name: Flow - Lead Website Follow-Up RTF (US-001)
description: Review notes and approved patterns for the Lead_WebsiteFollowUp_RTF Record-Triggered Flow added for US-001
type: project
---

Lead_WebsiteFollowUp_RTF.flow-meta.xml was introduced for US-001 (2026-05-07). Approved with warnings.

Key structural facts:
- processType is AutoLaunchedFlow (correct for Record-Triggered Flows; not RecordTriggeredFlow — that enum does not exist in the metadata API).
- triggerType = RecordAfterSave + recordTriggerType = Create on the Start element — correct.
- Entry condition (LeadSource EqualTo 'Website') is on the Start element filterLogic/filters block — correct, no Decision node.
- Formula TaskDueDate: DATEVALUE({!$Flow.CurrentDateTime}) + 5 — dataType Date — correct.
- Task fields mapped: ActivityDate (formula), OwnerId ($Record.OwnerId), Subject (string literal), WhoId ($Record.Id) — all correct.
- status = Active.

Warning issued: Missing `<Status>` (Task Status) inputAssignment. Without it, the Task Status defaults to org-wide default (usually "Not Started") which is acceptable but explicit is better.
Warning issued: Missing `<Priority>` inputAssignment. Defaults to "Normal" — acceptable but not explicit.
Warning issued: No flow test (FlowTest metadata) accompanies the flow — recommended for regulated environments.
Warning issued: interviewLabel uses {!$Flow.CurrentDateTime} — valid but can generate very wide interview label strings in debug logs; cosmetic only.

**Why:** Record-Triggered Flow for Lead follow-up automation, part of US-001 acceptance criteria.

**How to apply:** When reviewing future edits to this flow, verify the entry condition remains on the Start element (not moved into a Decision node), and that any new Task field assignments do not duplicate the WhoId assignment (Lead Id already linked via WhoId).
