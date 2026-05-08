---
name: Lead Record-Triggered Flow Pattern (SCRUM-5)
description: Record-triggered After-Save flow on Lead for conditional Task creation — fully declarative, no Apex needed
type: project
---

SCRUM-5 established that conditional child-record creation on standard objects (Lead -> Task) is fully declarative and must not use Apex triggers. The flow file was committed in the HEAD commit of feature/SCRUM-5-lead-website-followup-task but later deleted from the working tree (git status `D`); the design document at docs/design-documents/SCRUM-5-DesignDocument.md contains the full XML specification for recreation.

**Why:** Flow Builder record-triggered After-Save flows natively support Create Records elements. Using Apex here violates the declarative-first principle and adds unnecessary deployment overhead.

**How to apply:** Any future story requesting "create a related record when a standard object record is created/updated with condition X" should default to a record-triggered Flow. Only escalate to Apex if:
- The logic involves complex branching beyond what a Decision element can handle
- Bulk data volumes require bulkified DML patterns that Flow cannot guarantee
- Cross-object callouts or complex transformations are needed

**Flow naming convention established:** `<Object>_<Trigger>_<Purpose>` in snake_case (e.g., `Lead_Website_FollowUp_Task`).

**Entry condition placement:** Always filter on the Start node entry condition (not a Decision element inside the Flow) to exit early for non-matching records and conserve processing.

**Date arithmetic:** Use a Formula resource (`{!$Flow.CurrentDate} + N`) rather than hard-coded date offsets.
