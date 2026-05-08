# SALESFORCE REQUIREMENTS DOCUMENT

**Jira Story:** SCRUM-6
**Date:** 2026-05-09
**Assignee:** Prasanthi K
**Priority:** Medium
**Status at time of design:** To Do

---

**Request Summary:**
As a property seeker, users must be able to mark Property\_\_c records as favorites from both the
Property Explorer listing page (via a heart icon on each property tile) and the Property detail
record page (via an "Add to Favorites" / "Remove from Favorites" button). Favorites must persist
across sessions, be visible in a dedicated "My Favorites" view, support toggle (add and remove),
and allow direct navigation from the favorites list to the property detail page.

**Business Objective:**
Reduce friction in the property search journey by allowing seekers to shortlist properties they
are interested in without needing to search again. This drives higher engagement with the
DreamHouse application and improves the path-to-decision for buyers.

**Assumptions:**

1. A "favorite" is scoped to the currently logged-in Salesforce user — each user has their own
   independent favorites list.
2. Favorites are stored as a custom junction object (Favorite**c) linking the running User to a
   Property**c record. This is preferred over a multi-select field on Property\_\_c to correctly
   support per-user scoping and CRUD operations.
3. The "My Favorites" view is implemented as a new LWC component surfaced as a new App Page tab
   in the DreamHouse Lightning App (alongside Property Explorer and Property Finder).
4. The heart icon on the property tile uses a filled vs. outlined utility icon to communicate
   favorite state (utility:heart vs. utility:hearts — or a CSS toggle pattern).
5. Clicking the heart icon does not navigate away from the listing — it performs an in-place
   Apex callout and updates local component state reactively.
6. The "Add to Favorites" / "Remove from Favorites" button on the Property Record Page is a new
   LWC component added to the sidebar region of Property_Record_Page.flexipage-meta.xml.
7. The dreamhouse permission set is the target for all new object/field/class permissions.
8. API version 64.0 is used throughout.
9. No Lightning Message Service channel is introduced for favorites; the favorite toggle is
   self-contained within the tile/detail components using imperative Apex and local state.

**Out of Scope:**

- Sharing or exporting a favorites list to other users.
- Email or in-app notification when a favorited property changes status or price.
- Favorites across multiple properties objects or external listings.
- Mobile offline support for favorites.
- Any changes to Broker\_\_c, Account, or existing Apex classes other than PropertyController.

---

## Component Checklist

| #   | Component                                   | Type                                      | Action | Status |
| --- | ------------------------------------------- | ----------------------------------------- | ------ | ------ |
| 1   | Favorite\_\_c                               | Custom Object                             | CREATE | [ ]    |
| 2   | Favorite**c.Property**c                     | Custom Field (Lookup)                     | CREATE | [ ]    |
| 3   | Favorite**c.User**c                         | Custom Field (Lookup)                     | CREATE | [ ]    |
| 4   | Favorite\_\_c (object permissions)          | dreamhouse Permission Set                 | UPDATE | [ ]    |
| 5   | Favorite**c.Property**c (field permissions) | dreamhouse Permission Set                 | UPDATE | [ ]    |
| 6   | Favorite**c.User**c (field permissions)     | dreamhouse Permission Set                 | UPDATE | [ ]    |
| 7   | FavoriteController                          | Apex Class                                | CREATE | [ ]    |
| 8   | FavoriteController (class access)           | dreamhouse Permission Set                 | UPDATE | [ ]    |
| 9   | propertyTile (heart icon + toggle)          | LWC — UPDATE                              | UPDATE | [ ]    |
| 10  | favoriteButton                              | LWC Component                             | CREATE | [ ]    |
| 11  | myFavorites                                 | LWC Component                             | CREATE | [ ]    |
| 12  | My_Favorites                                | Lightning App Page (FlexiPage)            | CREATE | [ ]    |
| 13  | My_Favorites tab                            | dreamhouse Permission Set tabSettings     | UPDATE | [ ]    |
| 14  | Property_Record_Page.flexipage              | FlexiPage — add favoriteButton to sidebar | UPDATE | [ ]    |
| 15  | package.xml                                 | Deployment Manifest                       | UPDATE | [ ]    |
| 16  | FavoriteControllerTest                      | Apex Test Class                           | CREATE | [ ]    |
| 17  | propertyTile Jest tests                     | Jest Test File                            | UPDATE | [ ]    |
| 18  | favoriteButton Jest tests                   | Jest Test File                            | CREATE | [ ]    |
| 19  | myFavorites Jest tests                      | Jest Test File                            | CREATE | [ ]    |

---

## SECTION A: ADMINISTRATION TASKS (Declarative / Configuration)

_These tasks should be handled through Salesforce Setup, point-and-click tools, and metadata
configuration without custom code._

| #   | Task                                                                  | Description                                                                                                                                                                                                                                                                                                                                   | Salesforce Feature  | Priority | Effort Estimate |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | --------------- |
| A1  | Create Favorite\_\_c custom object                                    | Create a new custom object named `Favorite__c` with label "Favorite" / plural "Favorites". Enable Activities: No. Enable Reports: Yes. Allow Search: No. Set Sharing Model to Private (each user sees only their own favorites). Add standard Name field as Auto Number format `FAV-{0000}`.                                                  | Custom Object       | High     | S               |
| A2  | Create Favorite**c.Property**c lookup field                           | Add a Lookup field `Property__c` on `Favorite__c` pointing to `Property__c`. Label: "Property". Required: Yes. Child Relationship Name: `Favorites`. Delete behavior: Clear (so deleting a property removes the reference but does not cascade-delete favorites — the Apex controller must handle orphan cleanup).                            | Custom Field        | High     | S               |
| A3  | Create Favorite**c.User**c lookup field                               | Add a Lookup field `User__c` on `Favorite__c` pointing to the standard `User` object. Label: "User". Required: Yes. Child Relationship Name: `Favorites`. Delete behavior: Don't Allow (users cannot be deleted while favorites exist, which is acceptable in a scratch org context).                                                         | Custom Field        | High     | S               |
| A4  | Update dreamhouse Permission Set — Favorite\_\_c object permissions   | Add object permissions for `Favorite__c` to the `dreamhouse` permission set: allowCreate=true, allowRead=true, allowEdit=false, allowDelete=true, viewAllRecords=false, modifyAllRecords=false (users manage only their own records, enforced by sharing model + WITH USER_MODE in SOQL).                                                     | Permission Set      | High     | S               |
| A5  | Update dreamhouse Permission Set — Favorite\_\_c field permissions    | Add fieldPermissions for `Favorite__c.Property__c` (readable=true, editable=true) and `Favorite__c.User__c` (readable=true, editable=true) to the `dreamhouse` permission set.                                                                                                                                                                | Permission Set      | High     | S               |
| A6  | Update dreamhouse Permission Set — FavoriteController class access    | Add classAccesses entry for `FavoriteController` (enabled=true) to the `dreamhouse` permission set.                                                                                                                                                                                                                                           | Permission Set      | High     | S               |
| A7  | Create My_Favorites Lightning App Page (FlexiPage)                    | Create a new App Page FlexiPage named `My_Favorites` using the `pageTemplate_1_COLUMN` (single column) or `pageTemplate_2_7_3` template consistent with Property Explorer. Place the `myFavorites` LWC component in the main/center region. MasterLabel: "My Favorites". Type: AppPage.                                                       | FlexiPage           | Medium   | S               |
| A8  | Update dreamhouse Permission Set — My_Favorites tab visibility        | Add a tabSettings entry for `My_Favorites` (visibility=Visible) to the `dreamhouse` permission set so the new page appears in the DreamHouse app navigation.                                                                                                                                                                                  | Permission Set      | Medium   | S               |
| A9  | Update Property_Record_Page FlexiPage — add favoriteButton to sidebar | Add a componentInstance for `favoriteButton` LWC to the `sidebar` region of `Property_Record_Page.flexipage-meta.xml`, positioned above `propertyCarousel`. No properties required — the component derives the recordId from the standard record page context via `@api recordId`.                                                            | FlexiPage           | High     | S               |
| A10 | Update package.xml manifest                                           | Add entries for CustomObject (Favorite**c), CustomField (Favorite**c.Property**c, Favorite**c.User\_\_c), PermissionSet (dreamhouse), FlexiPage (My_Favorites, Property_Record_Page), LightningComponentBundle (favoriteButton, myFavorites, propertyTile), ApexClass (FavoriteController, FavoriteControllerTest) to `manifest/package.xml`. | Deployment Manifest | High     | S               |

---

## SECTION B: DEVELOPMENT TASKS (Programmatic / Custom Code)

_These tasks require custom Apex classes or Lightning Web Components because the requirements
cannot be satisfied declaratively._

| #   | Task                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Technology | Rationale for Code                                                                                                                                                                                                                                                                                  | Priority | Effort Estimate |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| B1  | FavoriteController Apex class                     | Create `FavoriteController` with three `@AuraEnabled` methods: (1) `isFavorite(Id propertyId)` — returns Boolean, queries Favorite**c WHERE Property**c = :propertyId AND User**c = :UserInfo.getUserId() WITH USER_MODE; (2) `addFavorite(Id propertyId)` — inserts a Favorite**c record linking current user to the property, with duplicate prevention via upsert or pre-check; (3) `removeFavorite(Id propertyId)` — deletes the matching Favorite**c record. Also (4) `getFavorites()` — returns `List<Property**c>`by joining through Favorite__c for the current user, returning the same fields used by`getPagedPropertyList`(Id, Name, Address__c, City__c, State__c, Price__c, Baths__c, Beds__c, Thumbnail__c). All methods use WITH USER_MODE.`isFavorite`is cacheable=true;`addFavorite`and`removeFavorite`are non-cacheable (DML).`getFavorites`is cacheable=true. Use`with sharing` class modifier.                                                           | Apex       | Toggle and persistence logic requires server-side DML (INSERT/DELETE on Favorite\_\_c) and per-user SOQL scoping that cannot be expressed declaratively. Wire adapters cannot perform DML.                                                                                                          | High     | M               |
| B2  | Update propertyTile LWC — add heart icon toggle   | Modify `propertyTile.html` to add a heart icon button (`lightning-button-icon`, icon-name driven by a getter: `utility:heart` when not favorited, `utility:hearts` when favorited) overlaid on the tile. Modify `propertyTile.js` to: import `isFavorite`, `addFavorite`, `removeFavorite` from `@salesforce/apex/FavoriteController`; call `isFavorite` in `connectedCallback` (imperative, not wire, because the tile is in a loop and each needs independent state); store `_isFavorite` as a tracked property; handle `handleFavoriteToggle` which calls `addFavorite` or `removeFavorite` imperatively and flips `_isFavorite` optimistically, reverting on error. Stop event propagation on the heart button click to prevent triggering `handlePropertySelected`. Update `propertyTile.css` to position the heart icon absolutely in the top-right corner of the tile. Update `propertyTile.js-meta.xml` — no change needed (component is not independently exposed). | LWC        | UI state (filled/outlined heart) is driven by per-user server data. Declarative record forms cannot conditionally display per-user favorite state on a list tile. The existing component must be modified rather than replaced to preserve the `onselected` event contract with `propertyTileList`. | High     | M               |
| B3  | Create favoriteButton LWC — record page button    | Create a new LWC component `favoriteButton` with: `@api recordId` property. In `connectedCallback`, call `isFavorite(recordId)` imperatively to set initial state. Render a `lightning-button` whose label is "Add to Favorites" or "Remove from Favorites" based on `_isFavorite`. On click, call `addFavorite` or `removeFavorite` and toggle `_isFavorite`, using `lightning-toast` or `ShowToastEvent` dispatcher for success/error feedback. Component is exposed on record pages via `targets: lightning__RecordPage` in the js-meta.xml.                                                                                                                                                                                                                                                                                                                                                                                                                              | LWC        | The Property Record Page requires a stateful button whose label and behavior change based on whether the current user has already favorited the property. This per-user state cannot be delivered by a standard component or declarative action.                                                    | High     | M               |
| B4  | Create myFavorites LWC — dedicated favorites view | Create a new LWC component `myFavorites` that: calls `getFavorites()` via `@wire` to retrieve the current user's favorited properties; renders them in the same tile-grid layout as `propertyTileList` by composing `c-property-tile` components (reusing the existing tile, which will now include the heart icon from B2); handles the `onselected` event from each tile by navigating to the property record page using `NavigationMixin` (App Page context has no `propertySummary` sidebar, so direct navigation is appropriate); shows a friendly empty-state message ("You have no saved favorites yet") when the list is empty; shows `c-error-panel` on wire errors. Expose on App Page via `targets: lightning__AppPage` in js-meta.xml.                                                                                                                                                                                                                           | LWC        | The favorites list is a dynamic, per-user collection requiring a wire call to `FavoriteController.getFavorites`. No standard related list can display a cross-object, per-user filtered list of Property\_\_c records. The `c-property-tile` component is reused to maintain visual consistency.    | Medium   | M               |
| B5  | FavoriteControllerTest Apex test class            | Create `FavoriteControllerTest` with `@isTest` covering: (1) `testIsFavoriteTrue` — insert a Favorite**c for a test user and verify `isFavorite` returns true; (2) `testIsFavoriteFalse` — verify `isFavorite` returns false with no record; (3) `testAddFavorite` — call `addFavorite` and verify a Favorite**c record exists; (4) `testAddFavoriteDuplicate` — call `addFavorite` twice, verify no duplicate (exception or clean handling); (5) `testRemoveFavorite` — add then remove, verify no record remains; (6) `testGetFavorites` — add a favorite, verify `getFavorites` returns the property with expected fields. Use `@TestSetup` to create a Property\_\_c test record. All tests use `System.runAs(testUser)` to validate user-scoped behavior. Target: 100% class coverage, minimum 90% line coverage.                                                                                                                                                       | Apex Test  | Apex test class required by Salesforce for all Apex deployments. Unit testing confirms per-user scoping, DML correctness, and duplicate handling in isolation.                                                                                                                                      | High     | M               |
| B6  | Update propertyTile Jest tests                    | Update `propertyTile.test.js` to: mock `@salesforce/apex/FavoriteController.isFavorite`, `addFavorite`, `removeFavorite`; add test cases verifying the heart icon renders in the correct initial state; add test cases verifying `handleFavoriteToggle` calls the correct Apex method and updates icon state; verify the favorite click does not propagate the `selected` event.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Jest       | Jest tests are required by project convention for all LWC components (CLAUDE.md). The existing test file must be updated to cover new branching logic introduced in B2.                                                                                                                             | High     | S               |
| B7  | Create favoriteButton Jest tests                  | Create `favoriteButton/__tests__/favoriteButton.test.js` mocking `isFavorite`, `addFavorite`, `removeFavorite`. Test: initial label renders as "Add to Favorites" when not favorited; label changes to "Remove from Favorites" after add; clicking button when favorited calls `removeFavorite`; toast is dispatched on success.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Jest       | Jest tests required by project convention for all new LWC components.                                                                                                                                                                                                                               | High     | S               |
| B8  | Create myFavorites Jest tests                     | Create `myFavorites/__tests__/myFavorites.test.js` mocking `getFavorites` wire. Test: empty state message renders when wire returns empty array; tiles render when wire returns data; `onselected` handler navigates to property record page; error panel renders on wire error.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Jest       | Jest tests required by project convention for all new LWC components.                                                                                                                                                                                                                               | Medium   | S               |

---

## SECTION C: ARCHITECTURAL DECISIONS

1. **Favorite**c as a junction object (not a field on Property**c or User)**
   Storing favorites as a dedicated Favorite**c object with Lookup fields to both Property**c and
   User is the only correct approach for per-user favorites. A multi-select picklist or text field
   on Property\_\_c cannot represent per-user state. A field on User cannot represent multiple
   properties. The junction object is normalized, queryable, and auditable.

2. **Sharing model: Private on Favorite\_\_c**
   Setting the org-wide default for Favorite\_\_c to Private ensures users can only read and delete
   their own favorites without additional sharing rules. Combined with WITH USER_MODE in all SOQL
   and DML, this follows the Salesforce Well-Architected Framework principle of least-privilege
   data access.

3. **Imperative Apex (not @wire) for isFavorite inside propertyTile**
   The `propertyTile` component is rendered inside a `for:each` loop in `propertyTileList`. Wire
   adapters share a reactive context and cannot reliably pass distinct per-item parameters in a
   loop without additional complexity. Imperative calls in `connectedCallback` give each tile
   independent, isolated server communication. This is the accepted pattern in the DreamHouse
   codebase (see `brokerCard` which also uses imperative calls for record-specific data).

4. **@wire for getFavorites in myFavorites**
   `myFavorites` renders a flat list for a single user — there is no per-item parameter variation.
   A wire adapter is appropriate here and benefits from the LDS cache, reducing server round-trips
   when the user navigates back to the favorites page within the same session.
   `cacheable=true` is set on `getFavorites` accordingly.

5. **Reuse of c-property-tile in myFavorites**
   The existing `propertyTile` component is composed inside `myFavorites` to ensure visual
   consistency between the favorites list and the property explorer. After B2, the tile will
   already render with heart icon state, so tiles in the favorites view will show the heart in the
   filled/active state automatically (since all listed properties are favorited).

6. **No new Lightning Message Service channel for favorites**
   The toggle is self-contained within each tile and the record page button. There is no
   cross-component state synchronization requirement for favorites at the App Page level (the
   favorites page and the explorer page are separate app pages). Introducing LMS for a purely
   local toggle would add unnecessary coupling. If cross-page real-time sync becomes a future
   requirement, a `FavoritesChanged__c` LMS channel can be added incrementally.

7. **NavigationMixin.Navigate in myFavorites for tile selection**
   Unlike the Property Explorer page (which has `propertySummary` and `propertyMap` in the right
   column that listen to PropertySelected LMS), the My Favorites App Page has no sidebar
   components requiring LMS coordination. Direct navigation to the record page is therefore the
   correct and simpler pattern. The `handlePropertySelected` handler in `myFavorites` uses
   `NavigationMixin.Navigate` to `standard__recordPage`.

8. **favoriteButton target: lightning\_\_RecordPage only**
   The `favoriteButton` component requires `recordId` from the record page context. It must not
   be placed on App Pages or Home pages where no record context is available. The js-meta.xml
   `targets` element is restricted to `lightning__RecordPage` to prevent misconfiguration.

---

## Agent Prompts for Implementation Pipeline

---

### ADMIN AGENT PROMPT

Use the salesforce-admin subagent to execute the following declarative/metadata tasks for SCRUM-6 (Favoriting Properties) in the DreamHouse LWC project (API version 64.0, scratch org).

**Project root:** `C:\Users\2094003\ClaudeSalesforceProject\dreamhouse-lwc`
**Source path:** `force-app/main/default/`
**Permission set file:** `force-app/main/default/permissionsets/dreamhouse.permissionset-meta.xml`
**Manifest:** `manifest/package.xml`

**Tasks to complete:**

**A1 — Create Favorite\_\_c custom object metadata**
Create file: `force-app/main/default/objects/Favorite__c/Favorite__c.object-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>false</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableReports>true</enableReports>
    <enableSearch>false</enableSearch>
    <enableSharing>true</enableSharing>
    <label>Favorite</label>
    <nameField>
        <displayFormat>FAV-{0000}</displayFormat>
        <label>Favorite Name</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>Favorites</pluralLabel>
    <sharingModel>Private</sharingModel>
</CustomObject>
```

**A2 — Create Favorite**c.Property**c lookup field**
Create file: `force-app/main/default/objects/Favorite__c/fields/Property__c.field-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Property__c</fullName>
    <deleteConstraint>SetNull</deleteConstraint>
    <label>Property</label>
    <referenceTo>Property__c</referenceTo>
    <relationshipLabel>Favorites</relationshipLabel>
    <relationshipName>Favorites</relationshipName>
    <required>true</required>
    <type>Lookup</type>
</CustomField>
```

**A3 — Create Favorite**c.User**c lookup field**
Create file: `force-app/main/default/objects/Favorite__c/fields/User__c.field-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>User__c</fullName>
    <deleteConstraint>RestrictDelete</deleteConstraint>
    <label>User</label>
    <referenceTo>User</referenceTo>
    <relationshipLabel>Favorites</relationshipLabel>
    <relationshipName>Favorites</relationshipName>
    <required>true</required>
    <type>Lookup</type>
</CustomField>
```

**A4-A8 — Update dreamhouse permission set**
Edit `force-app/main/default/permissionsets/dreamhouse.permissionset-meta.xml` to add:

- classAccesses for FavoriteController (enabled=true)
- objectPermissions for Favorite\_\_c (allowCreate=true, allowDelete=true, allowEdit=false, allowRead=true, modifyAllRecords=false, viewAllRecords=false)
- fieldPermissions for Favorite**c.Property**c (editable=true, readable=true)
- fieldPermissions for Favorite**c.User**c (editable=true, readable=true)
- tabSettings for My_Favorites (visibility=Visible)

**A9 — Update Property_Record_Page.flexipage-meta.xml**
Edit `force-app/main/default/flexipages/Property_Record_Page.flexipage-meta.xml`.
In the `sidebar` region, add a new componentInstance for `favoriteButton` BEFORE the existing
`propertyCarousel` componentInstance:

```xml
<itemInstances>
    <componentInstance>
        <componentName>favoriteButton</componentName>
        <identifier>c_favoriteButton</identifier>
    </componentInstance>
</itemInstances>
```

**A10 — Update manifest/package.xml**
Replace the contents of `manifest/package.xml` with entries covering:

- ApexClass: FavoriteController, FavoriteControllerTest, PagedResult, PropertyController, SampleDataController
- CustomField: Account.Banking_Name**c, Favorite**c.Property**c, Favorite**c.User\_\_c
- CustomObject: Favorite\_\_c
- FlexiPage: My_Favorites, Property_Record_Page, Property_Explorer, Property_Finder, Property_Record_Page, Broker_Record_Page, Settings
- LightningComponentBundle: brokerCard, daysOnMarket, errorPanel, favoriteButton, ldsUtils, myFavorites, paginator, propertyCarousel, propertyFilter, propertyListMap, propertyLocation, propertyMap, propertySummary, propertyTile, propertyTileList, sampleDataImporter
- PermissionSet: dreamhouse
- Version: 64.0

---

### DEVELOPER AGENT PROMPT

Use the salesforce-developer subagent to implement the following development tasks for SCRUM-6 (Favoriting Properties) in the DreamHouse LWC project (API version 64.0).

**Project root:** `C:\Users\2094003\ClaudeSalesforceProject\dreamhouse-lwc`
**Source path:** `force-app/main/default/`
**Code style:** 4-space indentation, single quotes, no trailing commas (Prettier config). ESLint applies LWC rules.

**B1 — Create FavoriteController.cls**

Create `force-app/main/default/classes/FavoriteController.cls` and its `-meta.xml`.

Class requirements:

- `public with sharing class FavoriteController`
- `@AuraEnabled(cacheable=true) public static Boolean isFavorite(Id propertyId)` — query Favorite**c WHERE Property**c = propertyId AND User\_\_c = UserInfo.getUserId() WITH USER_MODE, return !results.isEmpty()
- `@AuraEnabled public static void addFavorite(Id propertyId)` — check for existing record first; if not found, insert new Favorite**c(Property**c=propertyId, User\_\_c=UserInfo.getUserId()). Wrap in try/catch, throw AuraHandledException on error.
- `@AuraEnabled public static void removeFavorite(Id propertyId)` — query then delete matching Favorite\_\_c. Wrap in try/catch, throw AuraHandledException on error.
- `@AuraEnabled(cacheable=true) public static List<Property__c> getFavorites()` — query Favorite**c WHERE User**c = UserInfo.getUserId() WITH USER_MODE, collect Property**c Ids, return Property**c records with fields: Id, Name, Address**c, City**c, State**c, Price**c, Baths**c, Beds**c, Thumbnail**c, Location**Latitude**s, Location**Longitude\_\_s ordered by Name.

**B2 — Update propertyTile LWC**

Modify `force-app/main/default/lwc/propertyTile/propertyTile.html`:

- Add a `lightning-button-icon` for the heart toggle overlaid on the tile (top-right).
  Use `onclick={handleFavoriteToggle}` and stop propagation inside the handler.
  Set `icon-name={heartIconName}` and `alternative-text={favoriteButtonLabel}`.
  Add `data-id="favorite-btn"` for test targeting.

Modify `force-app/main/default/lwc/propertyTile/propertyTile.js`:

- Import `isFavorite`, `addFavorite`, `removeFavorite` from `@salesforce/apex/FavoriteController`.
- Add tracked `_isFavorite = false`.
- In `connectedCallback`, call `isFavorite({ propertyId: this.property.Id })` imperatively; on success set `this._isFavorite = result`; on error log and leave default false.
- Add getter `heartIconName` returning `'utility:hearts'` when `_isFavorite` is true, else `'utility:heart'`.
- Add getter `favoriteButtonLabel` returning `'Remove from Favorites'` when `_isFavorite`, else `'Add to Favorites'`.
- Add `handleFavoriteToggle(event)`: `event.stopPropagation()`; optimistically toggle `this._isFavorite`; call `addFavorite` or `removeFavorite` imperatively; revert on error and dispatch `ShowToastEvent` with error message.

Modify `force-app/main/default/lwc/propertyTile/propertyTile.css`:

- Add positioning rule for the heart button (absolute, top-right corner of the tile, z-index above background image).

**B3 — Create favoriteButton LWC**

Create `force-app/main/default/lwc/favoriteButton/` with:

- `favoriteButton.html` — renders a `lightning-button` with `label={buttonLabel}` and `onclick={handleToggle}`. Show a spinner while loading.
- `favoriteButton.js` — imports `isFavorite`, `addFavorite`, `removeFavorite`. `@api recordId`. On `connectedCallback` call `isFavorite` imperatively. Toggle on click with optimistic update, revert on error, dispatch `ShowToastEvent` for success and error.
- `favoriteButton.css` — minimal styling.
- `favoriteButton.js-meta.xml` — `apiVersion: 64.0`, `isExposed: true`, targets: `lightning__RecordPage` only.

**B4 — Create myFavorites LWC**

Create `force-app/main/default/lwc/myFavorites/` with:

- `myFavorites.html` — composes `c-property-tile` in a grid (same SLDS classes as `propertyTileList`). Render empty-state message when list is empty. Render `c-error-panel` on error.
- `myFavorites.js` — `@wire(getFavorites) favorites`. On `onselected` event from tile, use `NavigationMixin.Navigate` to navigate to `standard__recordPage` for the selected property Id.
- `myFavorites.css` — minimal; match `propertyTileList.css` grid styling.
- `myFavorites.js-meta.xml` — `apiVersion: 64.0`, `isExposed: true`, targets: `lightning__AppPage`.

**B5 — Create FavoriteControllerTest.cls**

Create `force-app/main/default/classes/FavoriteControllerTest.cls` and its `-meta.xml`.

Test class requirements:

- `@isTest` class, `with sharing`.
- `@TestSetup` — create a test Property**c record (Name='Test Property', Price**c=500000, Beds**c=3, Baths**c=2, Status\_\_c='Available').
- `testIsFavoriteFalse` — System.runAs(test user), call FavoriteController.isFavorite(propertyId), assert false.
- `testAddFavorite` — System.runAs, call addFavorite, query Favorite\_\_c, assert count = 1.
- `testAddFavoriteDuplicate` — call addFavorite twice, assert count remains 1 (no exception thrown).
- `testIsFavoriteTrue` — addFavorite then assert isFavorite returns true.
- `testRemoveFavorite` — addFavorite then removeFavorite, assert count = 0.
- `testGetFavorites` — addFavorite, call getFavorites, assert list size = 1 and returned property Id matches.
- Use `@TestSetup` pattern and `System.runAs` to ensure user-scoped tests.

**B6 — Update propertyTile Jest tests**

Update `force-app/main/default/lwc/propertyTile/__tests__/propertyTile.test.js`:

- Mock `@salesforce/apex/FavoriteController.isFavorite`, `addFavorite`, `removeFavorite`.
- Add test: heart icon renders with `utility:heart` when not favorited.
- Add test: heart icon renders with `utility:hearts` after `isFavorite` emits true.
- Add test: clicking heart calls `addFavorite` when not favorited.
- Add test: clicking heart calls `removeFavorite` when favorited.
- Add test: clicking heart does NOT fire `selected` event.

**B7 — Create favoriteButton Jest tests**

Create `force-app/main/default/lwc/favoriteButton/__tests__/favoriteButton.test.js`:

- Mock all three FavoriteController methods.
- Test: button label is "Add to Favorites" when isFavorite resolves to false.
- Test: button label is "Remove from Favorites" when isFavorite resolves to true.
- Test: clicking button when not favorited calls addFavorite and updates label.
- Test: clicking button when favorited calls removeFavorite and updates label.
- Test: ShowToastEvent is dispatched on addFavorite success.

**B8 — Create myFavorites Jest tests**

Create `force-app/main/default/lwc/myFavorites/__tests__/myFavorites.test.js`:

- Test: empty-state message renders when getFavorites wire emits empty array.
- Test: property tiles render when wire emits array of properties.
- Test: c-error-panel renders when wire emits error.
- Test: selecting a tile (onselected event) calls NavigationMixin.Navigate with correct recordPage attributes.
