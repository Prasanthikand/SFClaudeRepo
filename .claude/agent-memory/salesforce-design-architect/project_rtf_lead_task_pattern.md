---
name: RTF Lead Task Creation Pattern (US-001)
description: Architectural decisions for After Save Record-Triggered Flow on Lead that creates a Task when Lead Source = Website
type: project
---

US-001 is a fully declarative requirement: Record-Triggered Flow (After Save) on Lead, entry condition filters Lead Source = Website, creates a Task via Create Records element. No Apex required.

Key decisions established:
- After Save (not Before Save): required for cross-object record creation (Task is a separate SObject)
- Entry condition on Start element (not a Decision element): prevents unnecessary flow interviews for non-Website Leads
- Formula resource DATEVALUE({!$Flow.CurrentDateTime}) + 5 for due date (not TODAY(), not a variable)
- OwnerId = {!$Record.OwnerId} — never $User.Id
- WhoId = {!$Record.Id} to relate Task to Lead and surface it in Activity Timeline
- Trigger: Create only (not Create and Update)
- No custom objects or fields needed — standard Lead and Task only

Assumptions documented:
- Lead Source picklist API value is exactly "Website" (case-sensitive) — must verify in target org
- 5 calendar days (not business days); business-day calc would require Apex Invocable Method
- Task Priority/Status left as Salesforce defaults (Normal, Not Started)

Design document saved at: docs/design-documents/US-001-DesignDocument.md (created 2026-05-07, verified present)
User story source: docs/user-stories/US-001.md

**Why:** Fully within declarative capability. Apex would add unnecessary complexity and test overhead for a simple conditional Task creation pattern.
**How to apply:** Any future Lead automation with conditional Task creation should default to this same RTF After Save pattern unless business-day calculation or complex multi-object logic is required.
