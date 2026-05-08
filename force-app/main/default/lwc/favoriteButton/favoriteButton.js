import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import isFavorite from '@salesforce/apex/FavoriteController.isFavorite';
import addFavorite from '@salesforce/apex/FavoriteController.addFavorite';
import removeFavorite from '@salesforce/apex/FavoriteController.removeFavorite';

export default class FavoriteButton extends LightningElement {
    @api recordId;
    _isFavorite = false;
    isLoading = true;

    connectedCallback() {
        isFavorite({ propertyId: this.recordId })
            .then((result) => {
                this._isFavorite = result;
            })
            .catch((error) => {
                console.error('Error checking favorite status:', error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    get buttonLabel() {
        return this._isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }

    handleToggle() {
        this.isLoading = true;
        const wasFavorite = this._isFavorite;
        this._isFavorite = !this._isFavorite;
        const action = wasFavorite ? removeFavorite : addFavorite;
        action({ propertyId: this.recordId })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: wasFavorite
                            ? 'Removed from Favorites'
                            : 'Added to Favorites',
                        variant: 'success'
                    })
                );
            })
            .catch((error) => {
                this._isFavorite = wasFavorite;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body
                            ? error.body.message
                            : 'Unknown error',
                        variant: 'error'
                    })
                );
            })
            .finally(() => {
                this.isLoading = false;
            });
    }
}
