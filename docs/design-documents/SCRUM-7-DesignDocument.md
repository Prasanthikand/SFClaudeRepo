# SALESFORCE REQUIREMENTS DOCUMENT

**Jira Story:** SCRUM-7
**Date:** 2026-05-08
**Assignee:** Prasanthi K (prasanthi.kandula@cognizant.com)
**Priority:** Medium
**Status:** To Do

---

**Request Summary:**
Create a new custom text field named `Banking Name` on the standard Account object. The field must be deployed as Salesforce metadata, added to the `dreamhouse` permission set so that users assigned the permission set can read and write the field, and included in the `manifest/package.xml` deployment manifest.

**Business Objective:**
Capture a banking institution name against Account records to support banking-related data tracking within the org. The field provides a dedicated, structured location for this data rather than overloading an existing text field.

**Assumptions:**
1. The field is a plain Text type with a maximum length of 255 characters (standard default). No specific length was stated in the story.
2. The field is not required (blank permitted), as no constraint was specified.
3. The field should be added to the existing `dreamhouse` permission set with full read and edit access, consistent with all other Account-adjacent fields in that permission set.
4. No page layout modification is in scope for this ticket (scratch org uses dynamic forms / default layouts, and no specific layout was referenced).
5. No validation rule, formula, or automation is required on this field at this time.
6. API name for the field: `Banking_Name__c` (derived from label "Banking Name").

**Out of Scope:**
- Page layout assignments
- Reports or list views referencing the new field
- Apex or Flow logic that reads or writes the field
- Integration mappings
- Any LWC changes

---

## Component Checklist

| # | Component | Type | Action | Status |
|---|-----------|------|--------|--------|
| 1 | Account.Banking_Name__c | Custom Field (Text 255) | CREATE | [ ] |
| 2 | dreamhouse (Permission Set) | Permission Set — fieldPermissions | UPDATE | [ ] |
| 3 | manifest/package.xml | Deployment Manifest | UPDATE | [ ] |

---

## SECTION A: ADMINISTRATION TASKS (Declarative / Configuration)

*These tasks are handled through Salesforce metadata files — point-and-click equivalent. No custom code required.*

| # | Task | Description | Salesforce Feature | Priority | Effort Estimate |
|---|------|-------------|--------------------|----------|----------------|
| A1 | Create `Banking_Name__c` field on Account | Create the custom field metadata file at `force-app/main/default/objects/Account/fields/Banking_Name__c.field-meta.xml`. Type: Text, Length: 255, Label: "Banking Name", API Name: `Banking_Name__c`, Required: false, Unique: false. The `objects/Account/` directory does not currently exist in the project and must be created. | Custom Field — Standard Object Extension | High | S |
| A2 | Update `dreamhouse` permission set | Add a `<fieldPermissions>` entry for `Account.Banking_Name__c` with `<readable>true</readable>` and `<editable>true</editable>` to `force-app/main/default/permissionsets/dreamhouse.permissionset-meta.xml`. Pattern must match existing field permission entries already in the file. | Permission Set | High | S |
| A3 | Update `manifest/package.xml` | Add `Account.Banking_Name__c` under the `CustomField` metadata type section in `manifest/package.xml` so the field is included in non-scratch-org deployments. | Deployment Manifest | Medium | S |

---

## SECTION B: DEVELOPMENT TASKS (Programmatic / Custom Code)

*No development tasks are required for this story. The requirement is fully satisfied through declarative metadata configuration.*

No Apex, LWC, triggers, or integrations are needed. All work is captured in Section A.

---

## SECTION C: ARCHITECTURAL DECISIONS

- **Declarative-only solution:** Adding a custom field to a standard object and updating permission set access is 100% declarative. There is no governor-limit exposure, no test class requirement, and no deployment complexity beyond metadata files. This is the correct and preferred approach per the Salesforce Well-Architected Framework "Configuration over Customisation" principle.

- **Standard object field placement:** Because Account is a standard Salesforce object, its custom field metadata lives under `force-app/main/default/objects/Account/fields/`. The project currently has no Account folder (only `Broker__c` and `Property__c` custom objects). The admin agent must create the directory structure `objects/Account/fields/` before writing the field file.

- **Permission set strategy:** The `dreamhouse` permission set is the single permission set in this project and already controls access to all custom object fields. Granting `Banking_Name__c` read+edit access here is consistent with the established pattern and ensures any user assigned the Dreamhouse permission set can immediately interact with the field without a separate profile change.

- **No page layout change:** Scratch orgs in this project use default/dynamic page layouts. A page layout update is not required for functional access to the field. If a specific layout assignment is needed in a future sprint, a separate story should be raised.

- **API version:** All metadata files must declare `apiVersion 64.0`, consistent with `sfdx-project.json`.

---

## Agent Prompts

### Admin Agent Prompt

```
You are the Salesforce Admin agent. Execute the following tasks for Jira story SCRUM-7.
Working directory: C:\Users\2094003\ClaudeSalesforceProject\dreamhouse-lwc
Salesforce API version: 64.0

TASK A1 — Create custom field Banking_Name__c on Account
Create the file:
  force-app/main/default/objects/Account/fields/Banking_Name__c.field-meta.xml

The directory force-app/main/default/objects/Account/fields/ does not exist yet — create it.

File content:
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Banking_Name__c</fullName>
    <label>Banking Name</label>
    <type>Text</type>
    <length>255</length>
    <required>false</required>
    <unique>false</unique>
    <externalId>false</externalId>
    <trackFeedHistory>false</trackFeedHistory>
</CustomField>

TASK A2 — Update dreamhouse permission set
File: force-app/main/default/permissionsets/dreamhouse.permissionset-meta.xml

Add the following <fieldPermissions> block inside the <PermissionSet> element,
alongside the existing <fieldPermissions> entries (alphabetical order by field name is preferred):

    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Banking_Name__c</field>
        <readable>true</readable>
    </fieldPermissions>

TASK A3 — Update manifest/package.xml
File: manifest/package.xml

Add Account.Banking_Name__c as a member under the CustomField metadata type.
If a <types> block for CustomField already exists, append the member there.
If it does not exist, add a new <types> block:

    <types>
        <members>Account.Banking_Name__c</members>
        <name>CustomField</name>
    </types>

After all changes, verify the files are well-formed XML.
Do NOT deploy — the devops agent handles deployment.
```

### Developer Agent Prompt

No developer agent work is required for SCRUM-7. This story is fully declarative. Skip the developer agent and proceed directly to Code Review.

---

## Deployment Notes

- Deploy via: `sf project deploy start --source-dir force-app/main/default/objects/Account force-app/main/default/permissionsets/dreamhouse.permissionset-meta.xml`
- Target: scratch org (default)
- No Apex test classes required for field + permission set metadata deployment
- Post-deployment verification: confirm field appears on Account record page and that a user with the `dreamhouse` permission set can read and edit the field value
