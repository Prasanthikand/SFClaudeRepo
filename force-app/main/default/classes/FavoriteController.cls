/**
 * AuraEnabled controller for managing property favorites.
 * Provides methods to check, add, remove, and retrieve favorites
 * for the currently authenticated user.
 */
public with sharing class FavoriteController {
    /**
     * Checks whether the given property is already favorited by the current user.
     *
     * @param propertyId The Id of the Property__c record to check.
     * @return True if a Favorite__c record exists for this user and property; false otherwise.
     */
    @AuraEnabled(cacheable=true)
    public static Boolean isFavorite(Id propertyId) {
        List<Favorite__c> existing = [
            SELECT Id
            FROM Favorite__c
            WHERE Property__c = :propertyId AND User__c = :UserInfo.getUserId()
            WITH USER_MODE
            LIMIT 1
        ];
        return !existing.isEmpty();
    }

    /**
     * Adds the given property to the current user's favorites.
     * Idempotent — does nothing if the property is already favorited.
     *
     * @param propertyId The Id of the Property__c record to favorite.
     * @throws AuraHandledException If the insert operation fails.
     */
    @AuraEnabled
    public static void addFavorite(Id propertyId) {
        if (isFavorite(propertyId)) {
            return;
        }
        try {
            Favorite__c favorite = new Favorite__c(
                Property__c = propertyId,
                User__c = UserInfo.getUserId()
            );
            insert as user favorite;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Removes the given property from the current user's favorites.
     * Does nothing if no matching favorite record exists.
     *
     * @param propertyId The Id of the Property__c record to unfavorite.
     * @throws AuraHandledException If the delete operation fails.
     */
    @AuraEnabled
    public static void removeFavorite(Id propertyId) {
        try {
            List<Favorite__c> toDelete = [
                SELECT Id
                FROM Favorite__c
                WHERE
                    Property__c = :propertyId
                    AND User__c = :UserInfo.getUserId()
                WITH USER_MODE
            ];
            if (!toDelete.isEmpty()) {
                delete as user toDelete;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Returns the full list of Property__c records favorited by the current user,
     * ordered alphabetically by name.
     *
     * @return List of Property__c records; empty list if the user has no favorites.
     */
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getFavorites() {
        List<Favorite__c> favorites = [
            SELECT Property__c
            FROM Favorite__c
            WHERE User__c = :UserInfo.getUserId()
            WITH USER_MODE
        ];

        if (favorites.isEmpty()) {
            return new List<Property__c>();
        }

        Set<Id> propertyIds = new Set<Id>();
        for (Favorite__c fav : favorites) {
            propertyIds.add(fav.Property__c);
        }

        return [
            SELECT
                Id,
                Name,
                Address__c,
                City__c,
                State__c,
                Price__c,
                Baths__c,
                Beds__c,
                Thumbnail__c,
                Location__Latitude__s,
                Location__Longitude__s
            FROM Property__c
            WHERE Id IN :propertyIds
            WITH USER_MODE
            ORDER BY Name
        ];
    }
}
