import { LightningElement, api } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import isFavorite from '@salesforce/apex/FavoriteController.isFavorite';
import addFavorite from '@salesforce/apex/FavoriteController.addFavorite';
import removeFavorite from '@salesforce/apex/FavoriteController.removeFavorite';

export default class PropertyTile extends NavigationMixin(LightningElement) {
    @api property;
    formFactor = FORM_FACTOR;
    _isFavorite = false;

    connectedCallback() {
        isFavorite({ propertyId: this.property.Id })
            .then((result) => {
                this._isFavorite = result;
            })
            .catch((error) => {
                console.error('Error checking favorite status:', error);
            });
    }

    get heartIconName() {
        return this._isFavorite ? 'utility:hearts' : 'utility:heart';
    }

    get favoriteButtonLabel() {
        return this._isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }

    handleFavoriteToggle(event) {
        event.stopPropagation();
        this._isFavorite = !this._isFavorite;
        const action = this._isFavorite ? addFavorite : removeFavorite;
        action({ propertyId: this.property.Id }).catch((error) => {
            this._isFavorite = !this._isFavorite;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body ? error.body.message : 'Unknown error',
                    variant: 'error'
                })
            );
        });
    }

    handlePropertySelected() {
        if (FORM_FACTOR === 'Small') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.property.Id,
                    objectApiName: 'Property__c',
                    actionName: 'view'
                }
            });
        } else {
            const selectedEvent = new CustomEvent('selected', {
                detail: this.property.Id
            });
            this.dispatchEvent(selectedEvent);
        }
    }

    get backgroundImageStyle() {
        return `background-image:url(${this.property.Thumbnail__c})`;
    }
}