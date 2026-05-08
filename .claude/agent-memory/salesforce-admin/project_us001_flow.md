---
name: US-001 Lead Website Follow-Up Task Flow
description: Record-Triggered Flow on Lead (After Save, Create only) that creates a Task when LeadSource = Website — metadata file created and key design decisions recorded
type: project
---

Flow API Name: Lead_Website_FollowUp_Task
File: force-app/main/default/flows/Lead_Website_FollowUp_Task.flow-meta.xml
Label: Lead Website Follow Up Task
Status: Active
API Version: 64.0

Trigger: RecordAfterSave, recordTriggerType Create, object Lead
Entry condition on Start element: LeadSource EqualTo "Website" (filterLogic: and)
Formula resource: fml_DueDate — Date — {!$Flow.CurrentDate} + 5
Create Records element: Create_FollowUp_Task — Task object
  - Subject = "Follow up on Lead" (text literal / stringValue)
  - OwnerId = $Record.OwnerId (elementReference — Lead Owner)
  - WhoId = $Record.Id (elementReference — links Task to Lead Activity Timeline)
  - ActivityDate = fml_DueDate (elementReference — 5 calendar days from flow execution)
  - Status = "Not Started" (text literal / stringValue)
  - Priority = "Normal" (text literal / stringValue)

processType: AutoLaunchedFlow
processMetadataValues: BuilderType=LightningFlowBuilder, CanvasMode=AUTO_LAYOUT_CANVAS, OriginBuilderType=LightningFlowBuilder

**Why:** SCRUM-5 requires every new Website Lead to receive a follow-up Task automatically. After Save chosen because cross-object DML (creating a Task) is not permitted in Before Save flows. Entry condition on the Start element filters non-Website Leads before any flow interview is created (performance best practice). {!$Flow.CurrentDate} + 5 is the correct formula for a Date type resource in a Record-Triggered Flow.

**How to apply:** When referencing or modifying this flow, confirm the file exists at force-app/main/default/flows/Lead_Website_FollowUp_Task.flow-meta.xml. Note the camelCase in the API name — Lead_Website_FollowUp_Task (capital U in Up). No package.xml exists in this project; deployment is source-based via sf project deploy start.
