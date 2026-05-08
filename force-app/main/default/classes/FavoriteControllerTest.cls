/**
 * Tests for FavoriteController.
 * Covers isFavorite, addFavorite (including idempotency), removeFavorite, and getFavorites.
 * All DML and queries run as a Standard User with the dreamhouse permission set assigned.
 */
@isTest
private class FavoriteControllerTest {
    // ── Test Data Setup ──────────────────────────────────────────────────────

    @TestSetup
    static void makeData() {
        // Create test property as admin
        Property__c testProperty = new Property__c(
            Name = 'Test Property',
            Price__c = 300000,
            Beds__c = 3,
            Baths__c = 2,
            Status__c = 'Available'
        );
        insert testProperty;

        // Resolve Standard User profile
        Profile standardProfile = [
            SELECT Id
            FROM Profile
            WHERE Name = 'Standard User'
            LIMIT 1
        ];

        // Create test user
        User testUser = new User(
            Alias = 'tstfav',
            Email = 'favtest@dreamhouse-testorg.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'FavTest',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = standardProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'favtest@dreamhouse-testorg-scrum6.com'
        );
        insert testUser;

        // Assign dreamhouse permission set via System.runAs to avoid mixed DML error
        // (PermissionSetAssignment is a setup object; Property__c is non-setup)
        PermissionSet ps = [
            SELECT Id
            FROM PermissionSet
            WHERE Name = 'dreamhouse'
            LIMIT 1
        ];
        System.runAs(testUser) {
            insert new PermissionSetAssignment(
                AssigneeId = testUser.Id,
                PermissionSetId = ps.Id
            );
        }
    }

    // ── Happy Path ───────────────────────────────────────────────────────────

    @isTest
    static void isFavorite_noFavoriteExists_returnsFalse() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            Test.startTest();
            Boolean result = FavoriteController.isFavorite(testProperty.Id);
            Test.stopTest();

            Assert.areEqual(
                false,
                result,
                'isFavorite should return false when no favorite exists'
            );
        }
    }

    @isTest
    static void addFavorite_newProperty_createsFavoriteRecord() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            Test.startTest();
            FavoriteController.addFavorite(testProperty.Id);
            Test.stopTest();

            List<Favorite__c> favorites = [
                SELECT Id
                FROM Favorite__c
                WHERE Property__c = :testProperty.Id AND User__c = :testUser.Id
            ];
            Assert.areEqual(
                1,
                favorites.size(),
                'Exactly one Favorite__c record should exist after addFavorite'
            );
        }
    }

    @isTest
    static void addFavorite_calledTwice_remainsIdempotent() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            Test.startTest();
            FavoriteController.addFavorite(testProperty.Id);
            FavoriteController.addFavorite(testProperty.Id);
            Test.stopTest();

            List<Favorite__c> favorites = [
                SELECT Id
                FROM Favorite__c
                WHERE Property__c = :testProperty.Id AND User__c = :testUser.Id
            ];
            Assert.areEqual(
                1,
                favorites.size(),
                'Duplicate addFavorite call should not create a second record'
            );
        }
    }

    @isTest
    static void isFavorite_afterAddFavorite_returnsTrue() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            FavoriteController.addFavorite(testProperty.Id);

            Test.startTest();
            Boolean result = FavoriteController.isFavorite(testProperty.Id);
            Test.stopTest();

            Assert.areEqual(
                true,
                result,
                'isFavorite should return true after addFavorite'
            );
        }
    }

    @isTest
    static void removeFavorite_existingFavorite_deletesFavoriteRecord() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            FavoriteController.addFavorite(testProperty.Id);

            Test.startTest();
            FavoriteController.removeFavorite(testProperty.Id);
            Test.stopTest();

            List<Favorite__c> favorites = [
                SELECT Id
                FROM Favorite__c
                WHERE Property__c = :testProperty.Id AND User__c = :testUser.Id
            ];
            Assert.areEqual(
                0,
                favorites.size(),
                'Favorite__c record should be deleted after removeFavorite'
            );
        }
    }

    @isTest
    static void getFavorites_afterAddFavorite_returnsMatchingProperty() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            FavoriteController.addFavorite(testProperty.Id);

            Test.startTest();
            List<Property__c> results = FavoriteController.getFavorites();
            Test.stopTest();

            Assert.areEqual(
                1,
                results.size(),
                'getFavorites should return exactly one property'
            );
            Assert.areEqual(
                testProperty.Id,
                results[0].Id,
                'Returned property Id should match the favorited property'
            );
        }
    }

    // ── Edge Cases ───────────────────────────────────────────────────────────

    @isTest
    static void getFavorites_noFavorites_returnsEmptyList() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];

        System.runAs(testUser) {
            Test.startTest();
            List<Property__c> results = FavoriteController.getFavorites();
            Test.stopTest();

            Assert.areEqual(
                0,
                results.size(),
                'getFavorites should return an empty list when no favorites exist'
            );
        }
    }

    @isTest
    static void removeFavorite_noFavoriteExists_doesNotThrow() {
        User testUser = [
            SELECT Id
            FROM User
            WHERE UserName = 'favtest@dreamhouse-testorg-scrum6.com'
            LIMIT 1
        ];
        Property__c testProperty = [
            SELECT Id
            FROM Property__c
            WHERE Name = 'Test Property'
            LIMIT 1
        ];

        System.runAs(testUser) {
            Boolean exceptionThrown = false;
            Test.startTest();
            try {
                FavoriteController.removeFavorite(testProperty.Id);
            } catch (Exception e) {
                exceptionThrown = true;
            }
            Test.stopTest();

            Assert.areEqual(
                false,
                exceptionThrown,
                'removeFavorite should not throw when no favorite exists'
            );
        }
    }
}
