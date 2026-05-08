import { createElement } from '@lwc/engine-dom';
import PropertyTile from 'c/propertyTile';
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

const PROPERTY = {
    Name: 'My House',
    City__c: 'Some City',
    Beds__c: '3',
    Baths__c: '1',
    Price__c: '450000',
    Thumbnail__c: 'some-property.jpg',
    Id: '12345'
};

describe('c-property-tile', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    // Helper function to wait until the microtask queue is empty.
    // Used when having to wait for asynchronous DOM updates.
    async function flushPromises() {
        return Promise.resolve();
    }

    it('displays a property in the tile', () => {
        isFavorite.mockResolvedValue(false);
        const element = createElement('c-property-tile', {
            is: PropertyTile
        });
        element.property = PROPERTY;
        document.body.appendChild(element);

        const headerEl = element.shadowRoot.querySelector('.truncate');
        expect(headerEl.textContent).toBe(
            `${PROPERTY.City__c} • ${PROPERTY.Name}`
        );

        const paragraphEl = element.shadowRoot.querySelector('p');
        expect(paragraphEl.textContent).toBe(
            `Beds: ${PROPERTY.Beds__c} - Baths: ${PROPERTY.Baths__c}`
        );

        const priceEl = element.shadowRoot.querySelector(
            'lightning-formatted-number'
        );
        expect(priceEl.value).toBe(PROPERTY.Price__c);
    });

    it('displays the correct background image in the tile', () => {
        isFavorite.mockResolvedValue(false);
        const element = createElement('c-property-tile', {
            is: PropertyTile
        });
        element.property = PROPERTY;
        document.body.appendChild(element);

        const backgroundEl = element.shadowRoot.querySelector('.tile');
        expect(backgroundEl.style.backgroundImage).toBe(
            `url(${PROPERTY.Thumbnail__c})`
        );
    });

    it('Fires the property selected event on click for non Small formFactors', async () => {
        isFavorite.mockResolvedValue(false);
        const element = createElement('c-property-tile', {
            is: PropertyTile
        });
        element.property = PROPERTY;
        document.body.appendChild(element);

        // Mock handler for child event
        const handler = jest.fn();
        element.addEventListener('selected', handler);

        const anchorEl = element.shadowRoot.querySelector('a');
        anchorEl.click();

        // Wait for any asynchronous DOM updates
        await flushPromises();

        // Validate if event got fired
        expect(handler).toHaveBeenCalled();
        const selectEvent = handler.mock.calls[0][0];
        expect(selectEvent.detail).toBe(PROPERTY.Id);
    });

    it('is accessible', async () => {
        isFavorite.mockResolvedValue(false);
        const element = createElement('c-property-tile', {
            is: PropertyTile
        });

        element.property = PROPERTY;
        document.body.appendChild(element);

        await expect(element).toBeAccessible();
    });

    describe('favoriting', () => {
        it('heart icon renders with utility:heart when not favorited', async () => {
            isFavorite.mockResolvedValue(false);
            const element = createElement('c-property-tile', {
                is: PropertyTile
            });
            element.property = PROPERTY;
            document.body.appendChild(element);

            await flushPromises();

            const favoriteBtn = element.shadowRoot.querySelector(
                '[data-id="favorite-btn"]'
            );
            expect(favoriteBtn.iconName).toBe('utility:heart');
        });

        it('heart icon renders with utility:hearts when isFavorite resolves true', async () => {
            isFavorite.mockResolvedValue(true);
            const element = createElement('c-property-tile', {
                is: PropertyTile
            });
            element.property = PROPERTY;
            document.body.appendChild(element);

            await flushPromises();

            const favoriteBtn = element.shadowRoot.querySelector(
                '[data-id="favorite-btn"]'
            );
            expect(favoriteBtn.iconName).toBe('utility:hearts');
        });

        it('clicking heart calls addFavorite when not favorited', async () => {
            isFavorite.mockResolvedValue(false);
            addFavorite.mockResolvedValue();
            const element = createElement('c-property-tile', {
                is: PropertyTile
            });
            element.property = PROPERTY;
            document.body.appendChild(element);

            await flushPromises();

            const favoriteBtn = element.shadowRoot.querySelector(
                '[data-id="favorite-btn"]'
            );
            favoriteBtn.click();

            await flushPromises();

            expect(addFavorite).toHaveBeenCalledWith({
                propertyId: PROPERTY.Id
            });
        });

        it('clicking heart calls removeFavorite when favorited', async () => {
            isFavorite.mockResolvedValue(true);
            removeFavorite.mockResolvedValue();
            const element = createElement('c-property-tile', {
                is: PropertyTile
            });
            element.property = PROPERTY;
            document.body.appendChild(element);

            await flushPromises();

            const favoriteBtn = element.shadowRoot.querySelector(
                '[data-id="favorite-btn"]'
            );
            favoriteBtn.click();

            await flushPromises();

            expect(removeFavorite).toHaveBeenCalledWith({
                propertyId: PROPERTY.Id
            });
        });

        it('clicking heart does NOT fire selected event', async () => {
            isFavorite.mockResolvedValue(false);
            addFavorite.mockResolvedValue();
            const element = createElement('c-property-tile', {
                is: PropertyTile
            });
            element.property = PROPERTY;
            document.body.appendChild(element);

            await flushPromises();

            const handler = jest.fn();
            element.addEventListener('selected', handler);

            const favoriteBtn = element.shadowRoot.querySelector(
                '[data-id="favorite-btn"]'
            );
            favoriteBtn.click();

            await flushPromises();

            expect(handler).not.toHaveBeenCalled();
        });
    });
});
