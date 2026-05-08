import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFavorites from '@salesforce/apex/FavoriteController.getFavorites';

export default class MyFavorites extends NavigationMixin(LightningElement) {
    @wire(getFavorites) favorites;

    get hasFavorites() {
        return (
            this.favorites &&
            this.favorites.data &&
            this.favorites.data.length > 0
        );
    }

    get hasError() {
        return this.favorites && !!this.favorites.error;
    }

    handlePropertySelected(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.detail,
                actionName: 'view'
            }
        });
    }
}
