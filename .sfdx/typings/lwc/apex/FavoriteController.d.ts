declare module "@salesforce/apex/FavoriteController.isFavorite" {
  export default function isFavorite(param: {propertyId: any}): Promise<any>;
}
declare module "@salesforce/apex/FavoriteController.addFavorite" {
  export default function addFavorite(param: {propertyId: any}): Promise<any>;
}
declare module "@salesforce/apex/FavoriteController.removeFavorite" {
  export default function removeFavorite(param: {propertyId: any}): Promise<any>;
}
declare module "@salesforce/apex/FavoriteController.getFavorites" {
  export default function getFavorites(): Promise<any>;
}
