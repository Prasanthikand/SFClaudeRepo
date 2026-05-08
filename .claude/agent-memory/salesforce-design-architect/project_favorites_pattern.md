---
name: Favorites / Per-User Junction Object Pattern
description: SCRUM-6 established the design pattern for per-user favorites using a Favorite__c junction object, imperative Apex in looped tiles, and a dedicated My Favorites App Page.
type: project
---

SCRUM-6 (Favoriting Properties) establishes the following patterns for the DreamHouse project:

**Junction object for per-user data:** When a feature requires associating a record with a specific
user (not a shared state), create a dedicated custom object (Favorite__c) with Lookup fields to
both the target object and User. Never use a field on the target object or User for this purpose.

**Sharing model:** Set org-wide default to Private on user-scoped junction objects. Always use
WITH USER_MODE in all SOQL and DML within the Apex controller to enforce sharing at the query level.

**Imperative Apex inside for:each loops:** Wire adapters cannot reliably handle distinct per-item
parameters when a component is rendered in a for:each loop (e.g., propertyTile inside
propertyTileList). Use imperative calls in connectedCallback instead. This is consistent with the
brokerCard pattern already in the codebase.

**Wire adapter for single-user flat lists:** When a component renders a flat list for the current
user with no per-item parameter variation (e.g., myFavorites), use @wire with cacheable=true to
benefit from LDS caching.

**Reuse existing tile components:** The myFavorites LWC composes c-property-tile to maintain
visual consistency. After propertyTile is updated with the heart toggle (B2), all tiles in the
favorites view automatically show the filled heart state.

**No LMS for self-contained toggles:** Favorite state toggles do not require a new LMS channel
because the toggle is self-contained within the tile and record page button. LMS is only needed
when multiple components on the same page must react to a shared selection event.

**favoriteButton targets:** LWC components that require recordId from the page context must set
targets in js-meta.xml to lightning__RecordPage only.

**NavigationMixin pattern on App Pages with no sidebar:** When a My Favorites App Page (no
PropertySelected LMS subscribers) receives a tile select event, navigate directly to
standard__recordPage rather than publishing an LMS message.

**Why:** Per-user state cannot be expressed declaratively or through standard related lists.
Junction objects are the correct normalized data model. The imperative vs. wire distinction in
loops prevents reactive cascades across multiple tile instances.

**How to apply:** Any future feature requiring per-user association with a record should follow
this Favorite__c object + FavoriteController pattern. Check for existing junction objects before
creating new ones. Always add object/field/class permissions to the dreamhouse permission set.
