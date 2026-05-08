---
name: Deployment Patterns and Known Issues
description: Org-specific deployment patterns, metadata gotchas, and resolutions discovered during SCRUM-6 deployment
type: project
---

## Two-Pass Deployment for New Custom Objects + Permission Sets

When deploying a new custom object AND a permission set that grants access to it in the same transaction, the object permissions in the permission set are silently dropped. The platform processes metadata in order and the object doesn't exist when the perm set is processed.

**Fix:** Deploy with `--test-level NoTestRun` first (gets all components into the org), then run Apex tests separately with `sf apex run test`.

**Why:** Single-transaction deployments with `RunLocalTests` roll back everything if Apex tests fail. If the perm set lacks object permissions (because they were silently dropped), the tests fail, causing full rollback. Two-pass avoids this.

**How to apply:** Any time a deployment includes a new CustomObject + PermissionSet + ApexClass together, use NoTestRun for the deployment and run tests post-deploy.

## Required Lookup Fields in Permission Sets

Salesforce will reject any `fieldPermissions` entry (even `editable: false`) in a permission set for a required custom field. The error: "You cannot deploy to a required field: ObjectName.FieldName".

**Fix:** Remove the `fieldPermissions` entry entirely for required fields. Read access is automatically granted when the user has object-level read CRUD.

## Lookup to User Object — deleteConstraint

Lookup fields pointing to the User standard object do NOT support `Restrict` or `Cascade` deleteConstraints. Only `SetNull` is valid. Also, such fields cannot be `required: true` (required + SetNull is contradictory).

**Fix:** Set `deleteConstraint: SetNull` and `required: false` for User lookups.

## Mixed DML in Apex Test @TestSetup

Inserting `Property__c` (non-setup object) and `PermissionSetAssignment` (setup object) in the same `@TestSetup` method causes `MIXED_DML_OPERATION` error.

**Fix:** Wrap the `PermissionSetAssignment` insert in a `System.runAs(testUser)` block inside `@TestSetup`.

## FlexiPage XML for API v64.0

- Use `<template><name>pageTemplate_2_7_3</name></template>` (NOT the old `<pageTemplate>` string element)
- Use `<itemInstances>` containing `<componentInstance>` (NOT `<componentInstances>`)
- Component names in FlexiPages do NOT use namespace prefix (use `myFavorites` not `c:myFavorites`)
- Do NOT include `<mode>Replace</mode>` on fresh AppPages — only use it when overriding an existing template region
- Template `pageTemplate_2_7_3` is the standard 3-column app page template used by all existing dreamhouse AppPages

## Empty CSS Files in LWC Bundles

An empty `.css` file in an LWC bundle causes deployment error: "Lightning Component Resource cannot be empty." Delete the file rather than leaving it empty.

## WITH USER_MODE + FLS on Lookup Fields

When using `insert as user` (or `WITH USER_MODE`) in Apex, the user must have `editable: true` FLS on every field being written. For Favorite__c.User__c (a lookup to User), the permission set must have `editable: true` for the insert to succeed even though the field is set to the current user's Id.
