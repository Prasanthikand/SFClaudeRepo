---
name: generate-flow

description: Generate Salesforce Flows using the MCP tool execute_metadata_action. Use when the user asks to create, build, or generate a flow — including Screen, Autolaunched, Record-Triggered (before/after-save), Scheduled. Also trigger for flow-like requests such as "when a record is created", "trigger daily at", "send an email when", "update the field when", "automate", "workflow", or "flow XML/metadata". This is the only skill for Salesforce Flow generation.
---

## Goal

Generate Salesforce Flow metadata by running the required 3-step MCP pipeline (fetchGroundedObjectMetadata → flowElementSelection → flowElementGeneration) and return the flow XML.

## When to Use This Skill

Use this skill when you need to:
- Create any type of Flow (Screen, Autolaunched, Record-Triggered, Scheduled)
- Generate Flow metadata XML
- Automate business processes without code
- Build user-guided workflows or background automation
- Troubleshoot deployment errors related to Flows

## Specification

### Flow Metadata Specification

#### Overview
Salesforce Flows are powerful automation tools that enable complex business process automation without code. Flows can collect and process data through interactive screens, execute logic and calculations, manipulate records, call external services, and trigger based on various events. Flow types include Screen Flows (user-guided), Autolaunched Flows (background processing), Record-Triggered Flows (database events) and Scheduled Flows (time-based).

#### Purpose
- Automate complex business processes with declarative logic and branching
- Guide users through multi-step data collection and decision workflows via Screen Flows
- Perform CRUD operations on Salesforce records automatically
- Execute background processing and integrations via Autolaunched Flows
- React to record changes in real-time with Record-Triggered Flows
- Schedule recurring tasks and batch operations with Scheduled Flows
- Create reusable, maintainable automation that admins can modify without code

## Quick Reference

| Task | Approach |
|------|----------|
| Generate any Flow | Run the mandatory 3-step MCP pipeline |
| Fix deployment errors | Targeted manual XML edits only (sole exception to no-manual-XML rule) |
| Multiple flows | Separate 3-step pipeline per flow, executed sequentially |

---

## Mandatory 3-Step Pipeline

**CRITICAL: This is the ONLY supported way to generate Flow metadata. Never manually create, modify, or generate Flow XML outside this pipeline. Never skip, reorder, or combine steps.**

```
Step 1: fetchGroundedObjectMetadata
Step 2: flowElementSelection
Step 3: flowElementGeneration  ← loop until isComplete = true
```

All steps use MCP tool: `execute_metadata_action`  
The `action` parameter selects the step.

---

### Step 1 — fetchGroundedObjectMetadata

Fetches org schema metadata relevant to the flow. Always called first.

**Inputs (all required):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userPrompt` | STRING | The user's natural language request |
| `inflightMetadata` | ARRAY | Custom objects/fields from local sfdx project; `[]` if none |

**Output:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `groundingMetadata` | STRING | Org schema metadata — pass directly to Step 2 as-is, do NOT re-serialize |

---

### Step 2 — flowElementSelection

Selects flow elements and their connections based on the prompt and grounded metadata. Called after Step 1.

**Inputs (all required):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userPrompt` | STRING | Same value as Step 1 |
| `groundingMetadata` | STRING | Exact string from Step 1 output — do NOT serialize again |
| `operationId` | STRING | Use `""` for the first call |

**Outputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `operationId` | STRING | Pass to Step 3 |
| `userOutput` | STRING | Reasoning for next steps (can show to user) |

---

### Step 3 — flowElementGeneration (loop)

Generates flow metadata one element at a time. Called after Step 2. **Must be called repeatedly in a loop until `isComplete` is `true`.**

**Inputs (all required):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `operationId` | STRING | From Step 2 output — same value for every iteration |
| `requestSource` | STRING | Always `"A4V"` to get XML output |

**Outputs:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `isComplete` | BOOLEAN | `true` = generation finished; `false` = call again |
| `result` | STRING | Final flow XML — only populated when `isComplete` is `true` |

**Loop rules:**
- Call with the same `operationId` every iteration — never change it.
- If `isComplete` is `false` and no errors: call again immediately. Do NOT pause, summarize, or ask the user to confirm.
- A flow can have 10, 15, or more elements — many iterations are expected and normal.
- Stop only when `isComplete` is `true` OR errors are returned.
- Extract the final XML from `result` only when `isComplete` is `true`.

---

## inflightMetadata Format

**Data type: ARRAY (never a string)**

### Property naming — MUST follow exactly

| Property | Correct name | Do NOT use |
|----------|-------------|------------|
| Object API name | `apiName` | `objectApiName`, `name`, `objectName` |
| Field API name | `apiName` | `fieldApiName`, `name`, `fieldName` |
| Field type | `type` | `fieldType`, `dataType` |
| Lookup target | `referenceTo` | `relatedTo`, `lookupTo`, `reference` |

### Decision logic (mandatory)

1. Scan the local sfdx project for custom objects/fields relevant to the flow.
2. If relevant custom objects **are** found → pass structured array (see format below).
3. If **no** relevant custom objects found → pass `[]` (empty array literal, not the string `"[]"`).
4. Never put flow requirements in `inflightMetadata` — only object/field metadata goes here.

### Format with custom objects

```json
[
  {
    "type": "CustomObject",
    "apiName": "CustomerRequest__c",
    "label": "Customer Request",
    "fields": [
      { "apiName": "Status__c",     "type": "Picklist",  "label": "Status",       "values": ["New", "In Progress", "Completed"] },
      { "apiName": "Priority__c",   "type": "Number",    "label": "Priority" },
      { "apiName": "AssignedTo__c", "type": "Lookup",    "label": "Assigned To",  "referenceTo": "User" },
      { "apiName": "Description__c","type": "Textarea",  "label": "Description" },
      { "apiName": "Email__c",      "type": "Email",     "label": "Contact Email" },
      { "apiName": "DueDate__c",    "type": "Date",      "label": "Due Date" },
      { "apiName": "IsUrgent__c",   "type": "Boolean",   "label": "Is Urgent" },
      { "apiName": "Amount__c",     "type": "Currency",  "label": "Amount" }
    ],
    "relationships": []
  }
]
```

**Supported field types:** Text, Textarea, Number, Picklist, Lookup, Email, Phone, URL, Date, Datetime, Boolean, Checkbox, Currency, Percent

### Format with no custom objects

```json
[]
```

---

## Multiple Flows

**Each flow gets its own separate 3-step pipeline. Pipelines are executed sequentially — never in parallel.**

### Rules

- Split multi-flow requests into individual single-flow `userPrompt` values before calling any step.
- Never club multiple flow descriptions into one `userPrompt`.
- Complete a flow's full pipeline (including Step 3 loop) before starting the next flow's pipeline.
- Do NOT pause, summarize, or wait for user confirmation between flows.
- All N requested flows must be generated — never stop after the first.

### Wrong — multiple flows in one prompt

```json
{
  "userPrompt": "Create flows: 1) Record-Triggered on ResourceAllocation__c ... 2) Screen Flow to allocate resources ... 3) Record-Triggered on Supply__c ..."
}
```

### Correct — separate pipeline per flow

**Flow 1, Step 1:**
```json
{
  "userPrompt": "Create a Record-Triggered Flow on ResourceAllocation__c that updates Resource__c ...",
  "inflightMetadata": [...]
}
```
→ Complete Steps 2 and 3 for Flow 1.

**Flow 2, Step 1:**
```json
{
  "userPrompt": "Create a Screen Flow to allocate resources ...",
  "inflightMetadata": [...]
}
```
→ Complete Steps 2 and 3 for Flow 2.

**Flow 3, Step 1:**
```json
{
  "userPrompt": "Create a Record-Triggered Flow on Supply__c to auto-flag Low_Stock__c ...",
  "inflightMetadata": [...]
}
```
→ Complete Steps 2 and 3 for Flow 3.

---

## Example Tool Calls

### Standard objects only (no custom objects)

**Step 1 — fetchGroundedObjectMetadata:**
```json
{
  "userPrompt": "Create a scheduled-triggered Flow named Daily_Good_Morning that runs daily at 6:00 AM and sends an email to the running user saying good morning.",
  "inflightMetadata": []
}
```

**Step 2 — flowElementSelection:**
```json
{
  "userPrompt": "Create a scheduled-triggered Flow named Daily_Good_Morning that runs daily at 6:00 AM and sends an email to the running user saying good morning.",
  "groundingMetadata": "<exact string from Step 1 output>",
  "operationId": ""
}
```

**Step 3 — flowElementGeneration (repeat until isComplete = true):**
```json
{
  "operationId": "<operationId from Step 2>",
  "requestSource": "A4V"
}
```

---

### With custom objects from local sfdx project

**Step 1 — fetchGroundedObjectMetadata:**
```json
{
  "userPrompt": "Create a flow that updates the status of a Customer Request when it's assigned",
  "inflightMetadata": [
    {
      "type": "CustomObject",
      "apiName": "CustomerRequest__c",
      "label": "Customer Request",
      "fields": [
        { "apiName": "Status__c",     "type": "Picklist", "label": "Status", "values": ["New", "In Progress", "Completed"] },
        { "apiName": "AssignedTo__c", "type": "Lookup",   "label": "Assigned To", "referenceTo": "User" }
      ],
      "relationships": []
    }
  ]
}
```

**Step 2 — flowElementSelection:**
```json
{
  "userPrompt": "Create a flow that updates the status of a Customer Request when it's assigned",
  "groundingMetadata": "<exact string from Step 1 output>",
  "operationId": ""
}
```

**Step 3 — flowElementGeneration (repeat until isComplete = true):**
```json
{
  "operationId": "<operationId from Step 2>",
  "requestSource": "A4V"
}
```

---

## Critical Rules

- **No manual XML** — Never create, modify, or generate flow metadata outside the pipeline. The sole exception: targeted manual edits to fix explicit validation/deployment errors reported by the user.
- **No XML additions** — The final XML must be identical to what the pipeline returns. Do NOT add labels, X/Y coordinates, descriptions, or any other node not already present in the output.
- **userPrompt is consistent** — Must be the same value in Step 1 and Step 2.
- **groundingMetadata is a string** — Pass it directly from Step 1 to Step 2. Do not serialize, wrap, or modify it.
- **operationId is fixed** — Use the value from Step 2 for every Step 3 call. Never change it mid-loop.
- **requestSource is always "A4V"** — Required to receive XML output.
- **inflightMetadata is always an ARRAY** — Never a string, never `"[]"`.

---

## Pre/Post Generation Checklist

- [ ] All 3 steps called in order: `fetchGroundedObjectMetadata` → `flowElementSelection` → `flowElementGeneration`
- [ ] No flow metadata manually created or modified outside the pipeline
- [ ] `userPrompt` describes exactly one flow; multi-flow requests were split
- [ ] `userPrompt` is identical in Step 1 and Step 2
- [ ] `inflightMetadata` is an ARRAY (not a string)
- [ ] `inflightMetadata` is `[]` when no custom objects needed
- [ ] `inflightMetadata` contains structured objects (not text descriptions)
- [ ] `groundingMetadata` passed directly from Step 1 → Step 2 (not re-serialized)
- [ ] `operationId` passed from Step 2 → Step 3 and kept constant throughout the loop
- [ ] `requestSource` is `"A4V"`
- [ ] Step 3 looped until `isComplete` is `true` — no pausing or asking user to continue
- [ ] For multiple flows: each pipeline fully completed before the next one started
- [ ] XML extracted from `result` only when `isComplete` is `true`
- [ ] No nodes added to the returned XML


Note:
- File must be placed in `force-app/main/default/flows/`
- The file name must match the `<label>` converted to API name format (spaces → underscores, no special chars)
- For before-save flows, bulkification is automatic; for after-save, consider governor limits in loops

### Write the file (if confirmed)

If the user confirms, write the XML to `force-app/main/default/flows/<FlowApiName>.flow-meta.xml` using the Write tool.

## Quality rules

- Always set `<status>Active</status>` unless the user requests a draft
- Every element must have `<locationX>` and `<locationY>` for builder compatibility
- Use `{!variableName}` merge field syntax inside string values
- Prefer `<filterLogic>and</filterLogic>` explicitly over implicit AND
- Add a fault connector on any DML element when error handling is requested
- Never hard-code record Ids; use variables or queried records
- Follow bulkification best practices: avoid DML inside loops; use collections
