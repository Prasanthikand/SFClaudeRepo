# Salesforce Design Architect — Memory Index

- [Project Context](project_dreamhouse_context.md) — DreamHouse LWC project: API 64.0, scratch org, key objects and existing class patterns
- [Batch Delete Task Pattern](project_batch_delete_task.md) — Batch + Schedulable pattern established for US-001 Task cleanup; naming conventions and test structure decided
- [Lead Flow Pattern](project_lead_flow_pattern.md) — SCRUM-5: conditional child-record creation on Lead is fully declarative (record-triggered After-Save Flow); flow naming convention and date arithmetic pattern
- [Standard Object Custom Field Pattern](project_standard_object_field_pattern.md) — SCRUM-7: standard-object field additions are admin-only; Account/ dir must be created; dreamhouse PS always needs fieldPermissions entry
- [Favorites / Per-User Junction Object Pattern](project_favorites_pattern.md) — SCRUM-6: Favorite__c junction object + Private sharing + imperative Apex in loops + wire for flat lists; no LMS for self-contained toggles
