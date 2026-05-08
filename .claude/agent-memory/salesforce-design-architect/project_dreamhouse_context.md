---
name: Project Context
description: DreamHouse LWC project — API 64.0, scratch org, key objects and existing class patterns
type: project
---

DreamHouse LWC is a Salesforce DX project targeting API version 64.0, deployed to scratch orgs via `sf project deploy start`.

**Custom objects:** `Property__c`, `Broker__c`
**Existing Apex classes:** `PropertyController`, `GeocodingService`, `SampleDataController`, `PagedResult`, `FileUtilities`
**No triggers exist** in the project as of 2026-05-07.
**LWC components:** 18 components under `force-app/main/default/lwc/`
**Communication:** Lightning Message Service (cross-component), DOM events (parent-child)
**Test framework:** Jest via @salesforce/sfdx-lwc-jest; Apex tests follow standard platform conventions
**Code style:** 4-space indentation, single quotes, no trailing commas (Prettier); ESLint enforced via pre-commit hooks (Husky + lint-staged)

**Existing Apex pattern (PropertyController):** `public with sharing`, `@AuraEnabled(cacheable=true scope='global')`, bind variables in all SOQL, `WITH USER_MODE` on queries.

**Why:** Reference when assessing whether new Apex components fit the established pattern or require deviation (e.g., batch classes intentionally omit `with sharing`).

**How to apply:** New Apex should follow `with sharing` and `WITH USER_MODE` by default unless there is an explicit architectural reason to deviate (document the reason in the design document).
