import { createElement } from '@lwc/engine-dom';
import FavoriteButton from 'c/favoriteButton';
import isFavorite from '@salesforce/apex/FavoriteController.isFavorite';
import addFavorite from '@salesforce/apex/FavoriteController.addFavorite';
import removeFavorite from '@salesforce/apex/FavoriteController.removeFavorite';

jest.mock(
    '@salesforce/apex/FavoriteController.isFavorite',
    () => ({ default: jest.fn() }),
    { virtual: true }
);
jest.mock(
    '@salesforce/apex/FavoriteController.addFavorite',
    () => ({ default: jest.fn() }),
    { virtual: true }
);
jest.mock(
    '@salesforce/apex/FavoriteController.removeFavorite',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

const MOCK_RECORD_ID = 'a01xx000000001AAAQ';

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function createComponent() {
    const element = createElement('c-favorite-button', { is: FavoriteButton });
    element.recordId = MOCK_RECORD_ID;
    document.body.appendChild(element);
    return element;
}

describe('c-favorite-button', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('shows Add to Favorites when not favorited', async () => {
        isFavorite.mockResolvedValue(false);
        const element = createComponent();
        await flushPromises();
        const button = element.shadowRoot.querySelector('lightning-button');
        expect(button.label).toBe('Add to Favorites');
    });

    it('shows Remove from Favorites when favorited', async () => {
        isFavorite.mockResolvedValue(true);
        const element = createComponent();
        await flushPromises();
        const button = element.shadowRoot.querySelector('lightning-button');
        expect(button.label).toBe('Remove from Favorites');
    });

    it('calls addFavorite when not favorited and button is clicked', async () => {
        isFavorite.mockResolvedValue(false);
        addFavorite.mockResolvedValue();
        const element = createComponent();
        await flushPromises();
        const button = element.shadowRoot.querySelector('lightning-button');
        button.dispatchEvent(new CustomEvent('click'));
        await flushPromises();
        expect(addFavorite).toHaveBeenCalledWith({
            propertyId: MOCK_RECORD_ID
        });
    });

    it('calls removeFavorite when favorited and button is clicked', async () => {
        isFavorite.mockResolvedValue(true);
        removeFavorite.mockResolvedValue();
        const element = createComponent();
        await flushPromises();
        const button = element.shadowRoot.querySelector('lightning-button');
        button.dispatchEvent(new CustomEvent('click'));
        await flushPromises();
        expect(removeFavorite).toHaveBeenCalledWith({
            propertyId: MOCK_RECORD_ID
        });
    });
});
