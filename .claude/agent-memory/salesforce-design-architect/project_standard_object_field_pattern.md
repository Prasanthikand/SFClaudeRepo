---
name: Standard Object Custom Field Pattern
description: SCRUM-7 established how standard-object custom field additions are classified and where metadata lives in this project
type: project
---

SCRUM-7 added `Account.Banking_Name__c` (Text 255) — a custom field on a standard Salesforce object.

Key findings:
- Standard object metadata lives under `force-app/main/default/objects/<ObjectName>/fields/` — the `Account/` directory did not pre-exist and must be created on first use.
- Only `Broker__c` and `Property__c` (custom objects) have pre-existing object folders in this project.
- Adding a standard-object custom field is 100% declarative (Section A only — no developer agent needed).
- The `dreamhouse` permission set is the single permission set; all new fields (custom or standard-object) must receive a `<fieldPermissions>` entry with `readable` and `editable` true.
- `manifest/package.xml` must also be updated with the `CustomField` member for non-scratch deployments.

**Why:** No Apex or Flow is required for a plain field addition; Well-Architected "Configuration over Customisation" principle applies directly.

**How to apply:** Any future story that only adds/modifies a field on Account (or another standard object) should be classified as admin-only. Remind the admin agent to create the `objects/Account/` directory structure if it does not yet exist.
