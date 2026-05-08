---
name: Task.Description Not Filterable in SOQL
description: Task.Description is a LongTextArea field and cannot be used in a SOQL WHERE clause; initial deployment of DeleteStaleTasksBatch failed with this error
type: feedback
---

`Task.Description` (and any LongTextArea/RichTextArea field) cannot be used as a SOQL filter predicate. Attempting `WHERE Description = NULL` causes a compile error: "field 'Description' can not be filtered in a query call".

**Why:** Salesforce does not index LongTextArea fields, so they are excluded from SOQL WHERE filtering. This is a platform constraint that applies across all orgs.

**How to apply:** When writing batch queries against Task (or any object with LongTextArea fields) that need to filter on such a field, omit the filter from the SOQL and apply it in-memory inside the batch `execute()` method. Always SELECT the field so it is available for the in-memory check. Example fix applied to DeleteStaleTasksBatch: removed `WHERE Description = NULL` from QueryLocator, added `SELECT Id, Description`, and filtered `if (t.Description == null)` in execute().
