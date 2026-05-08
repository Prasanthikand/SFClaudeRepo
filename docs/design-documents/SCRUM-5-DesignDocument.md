# SALESFORCE REQUIREMENTS DOCUMENT

**Jira Issue:** SCRUM-5
**Date:** 2026-05-07
**Author:** Salesforce Design Architect
**Assignee:** Prasanthi K (prasanthi.kandula@cognizant.com)
**Priority:** Medium
**Status at Design Time:** To Do

---

## Request Summary

A Sales Representative requires that when a new Lead record is created in Salesforce with Lead Source set to "Website", a follow-up Task is automatically created and assigned to the Lead Owner. The Task must have a fixed Subject of "Follow up on Lead" and a Due Date of 5 days from the creation date. If Lead Source is any value other than "Website", no Task should be created. The mechanism must be entirely automated — no manual action by the Sales Representative is required after the Lead is saved.

## Business Objective

Ensure timely, consistent follow-up on website-sourced leads to maximize conversion rates. Automating Task creation eliminates the risk of human omission and guarantees every website lead receives the same structured follow-up treatment from the owning Sales Representative.

## Assumptions

1. The standard Lead Source picklist value "Website" already exists in the org (it is a Salesforce default value and no custom configuration is needed to add it).
2. The Task will use the standard Activity framework — no custom Task fields are required.
3. Task Status defaults to "Not Started" (Salesforce default for new Tasks) — no explicit Status override is needed.
4. Task Priority is not specified in the acceptance criteria; it will default to "Normal" (Salesforce default).
5. The flow must handle bulk Lead creation (e.g., data imports) without hitting governor limits — Flow's native bulkification covers this for After-Save record-triggered flows.
6. There are no multi-currency, multi-timezone, or territory management constraints that affect due-date calculation.
7. The flow should be active at deployment time.
8. No existing record-triggered flows on Lead conflict with this new flow (verified: no Lead flows exist in the project).

## Out of Scope

- Any modification to the Lead page layout or Lightning page.
- Custom fields on Lead or Task.
- Notifications, emails, or Chatter posts related to the Task.
- Lead assignment or routing rules.
- Handling of Lead update scenarios (this flow triggers on CREATE only).
- Any reporting or dashboard changes.

---

## Component Checklist

| # | Component | Type | Action | Status |
|---|-----------|------|--------|--------|
| 1 | Lead_Website_FollowUp_Task | Flow (Record-Triggered) | CREATE | [ ] |

---

## SECTION A: ADMINISTRATION TASKS (Declarative / Configuration)

These tasks should be handled through Salesforce Setup, point-and-click tools, and configuration without custom code.

| # | Task | Description | Salesforce Feature | Priority | Effort Estimate |
|---|------|-------------|-------------------|----------|----------------|
| A1 | Create Record-Triggered Flow on Lead | Create an After-Save, on-create-only record-triggered Flow named `Lead_Website_FollowUp_Task`. The flow entry condition filters for `LeadSource = Website` on the Start node. Inside the flow, a single Create Records element creates a Task with: WhoId = Lead.Id, OwnerId = Lead.OwnerId, Subject = "Follow up on Lead", ActivityDate = formula `{!$Flow.CurrentDate} + 5`, Status = "Not Started". The flow must be set to Active at save time. Full XML specification is provided in the Agent Prompt below. | Flow Builder — Record-Triggered (After Save) | High | S (2-3 hours) |

## SECTION B: DEVELOPMENT TASKS (Programmatic / Custom Code)

No development tasks are required for this user story. The entire requirement is satisfied declaratively via Flow Builder.

**Rationale for declarative-only approach:**
- Flow Builder's record-triggered After-Save flows natively support conditional logic (Decision elements or entry conditions on the Start node) and Create Records elements for child records.
- Bulk Lead creation is handled correctly by the Flow engine's native bulkification.
- The date arithmetic (`today + 5 days`) is supported natively via the `{!$Flow.CurrentDate}` global variable in a Formula resource.
- No complex transformations, callouts, or branching logic beyond a single condition check is required.
- Using Apex here would violate the declarative-first principle and introduce unnecessary deployment and test coverage overhead.

---

## SECTION C: ARCHITECTURAL DECISIONS

**Decision 1 — Entry condition on Start node, not a Decision element inside the flow**
Placing `LeadSource = Website` as an entry condition on the Start node means non-Website Leads exit the flow immediately without entering the flow body. This is more efficient than routing all Leads through the flow and branching with a Decision element, and it aligns with the Salesforce Well-Architected Framework guidance to "fail fast" at the earliest possible point.

**Decision 2 — After-Save trigger timing (not Before-Save)**
Task creation requires DML (inserting a new record). Before-Save flows cannot perform DML on related records — they can only modify the triggering record's fields in memory. After-Save is the correct and only viable trigger timing for this pattern.

**Decision 3 — WhoId used for Task-Lead relationship**
Tasks relate to Leads via the WhoId field (the "Name" relationship on Activity). Setting `WhoId = {!$Record.Id}` correctly links the Task to the Lead in the Activity timeline. Using WhatId would be incorrect here as WhatId is reserved for Accounts, Opportunities, and other non-person objects.

**Decision 4 — ActivityDate formula resource for due-date calculation**
Rather than hard-coding a date or relying on a complex formula in the Create Records element, a separate Formula resource of type Date (`{!$Flow.CurrentDate} + 5`) is defined and referenced in the ActivityDate field. This keeps the Create Records element clean and the formula unit-testable in isolation.

**Decision 5 — Flow naming convention**
The flow is named `Lead_Website_FollowUp_Task` following the established project convention: `<Object>_<Trigger/Condition>_<Purpose>` in Title_Snake_Case. This matches the prior pattern established in SCRUM-5 memory.

---

## SECTION D: RISKS AND DEPENDENCIES

| Risk | Severity | Mitigation |
|------|----------|------------|
| Future record-triggered flows on Lead may conflict if trigger order is not managed | Low | Salesforce processes all After-Save flows in the same transaction; since this flow creates a Task (not modifying the Lead), no infinite-loop risk exists. Document flow inventory as org grows. |
| Bulk data import via Data Loader could create a large volume of Tasks | Low | After-Save flows are bulkified by the platform; the Create Records element processes all qualifying Leads in a single DML batch. No governor limit risk. |
| Lead Source picklist value "Website" may have been renamed in a custom org | Low | Verify picklist values in Setup > Lead > Fields > Lead Source before deploying. The acceptance criteria explicitly names "Website" so this is treated as confirmed. |

---

## SECTION E: ACCEPTANCE CRITERIA TRACEABILITY

| Acceptance Criterion | Covered By | Notes |
|---------------------|------------|-------|
| When Lead is created with Lead Source = Website, a Task is created | A1 — Flow entry condition + Create Records element | Entry condition: `LeadSource Equals Website` |
| Task assigned to Lead Owner | A1 — Create Records element, OwnerId field | `OwnerId = {!$Record.OwnerId}` |
| Task Subject = "Follow up on Lead" | A1 — Create Records element, Subject field | Literal string value |
| Task Due Date = 5 days from today | A1 — Formula resource + Create Records element, ActivityDate field | `{!$Flow.CurrentDate} + 5` |
| If Lead Source != Website, no Task is created | A1 — Start node entry condition | Flow exits without executing Create Records |

---

## AGENT PROMPTS

### Admin Agent Prompt

Use the salesforce-admin subagent to implement the following declarative configuration for Jira story SCRUM-5.

**Story:** SCRUM-5 — Create a follow-up task on Lead creation
**Project:** dreamhouse-lwc Salesforce DX project at `C:\Users\2094003\ClaudeSalesforceProject\dreamhouse-lwc`
**API Version:** 64.0

**Task A1 — Create Record-Triggered Flow: Lead_Website_FollowUp_Task**

Create the file at:
`force-app/main/default/flows/Lead_Website_FollowUp_Task.flow-meta.xml`

The flow must be a record-triggered After-Save flow on the Lead object with the following specification:

- **Trigger:** RecordAfterSave, on Create only (`triggerType = RecordAfterSave`, `recordTriggerType = Create`)
- **Object:** Lead
- **Entry condition on Start node:** `LeadSource Equals Website` (filter operator: EqualTo, value: "Website")
- **Entry condition logic:** ALL conditions must be met (default)
- **Flow body — Formula Resource:**
  - Name: `FollowUpDueDate`
  - Data type: Date
  - Expression: `{!$Flow.CurrentDate} + 5`
- **Flow body — Create Records element:**
  - Label: `Create Follow Up Task`
  - Input reference: manually assign fields
  - Object: Task
  - Fields to set:
    - `WhoId` = `{!$Record.Id}` (reference)
    - `OwnerId` = `{!$Record.OwnerId}` (reference)
    - `Subject` = `"Follow up on Lead"` (string literal)
    - `ActivityDate` = `{!FollowUpDueDate}` (reference to formula resource)
    - `Status` = `"Not Started"` (string literal)
- **Flow status:** Active
- **API version:** 64.0

The flow XML must follow the standard Salesforce metadata format and be deployable via `sf project deploy start`. Ensure the XML is well-formed and all element references resolve correctly.

No other files need to be created or modified for this story.

After creating the file, confirm the absolute file path.

---

### Developer Agent Prompt

No developer (programmatic) work is required for SCRUM-5. This story is fully implemented by the Admin Agent via a declarative record-triggered Flow. Do not create any Apex classes, triggers, or LWC components for this story.
