import { createElement } from '@lwc/engine-dom';
import MyFavorites from 'c/myFavorites';
import getFavorites from '@salesforce/apex/FavoriteController.getFavorites';
import { getNavigateCalledWith } from 'lightning/navigation';

const mockGetFavorites = require('./data/getFavorites.json');

// Mock getFavorites Apex wire adapter
jest.mock(
    '@salesforce/apex/FavoriteController.getFavorites',
    () => {
        const {
            createApexTestWireAdapter
        } = require('@salesforce/sfdx-lwc-jest');
        return {
            default: createApexTestWireAdapter(jest.fn())
        };
    },
    { virtual: true }
);

describe('c-my-favorites', () => {
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

    it('renders empty state message when wire returns empty array', async () => {
        const element = createElement('c-my-favorites', { is: MyFavorites });
        document.body.appendChild(element);

        getFavorites.emit([]);

        await flushPromises();

        const emptyMsg = element.shadowRoot.querySelector('p');
        expect(emptyMsg).not.toBeNull();
        expect(emptyMsg.textContent).toBe('You have no saved favorites yet.');

        const tiles = element.shadowRoot.querySelectorAll('c-property-tile');
        expect(tiles.length).toBe(0);
    });

    it('renders c-property-tile components when wire emits data', async () => {
        const element = createElement('c-my-favorites', { is: MyFavorites });
        document.body.appendChild(element);

        getFavorites.emit(mockGetFavorites);

        await flushPromises();

        const tiles = element.shadowRoot.querySelectorAll('c-property-tile');
        expect(tiles.length).toBe(mockGetFavorites.length);
    });

    it('renders c-error-panel when wire emits error', async () => {
        const element = createElement('c-my-favorites', { is: MyFavorites });
        document.body.appendChild(element);

        getFavorites.error();

        await flushPromises();

        const errorPanel = element.shadowRoot.querySelector('c-error-panel');
        expect(errorPanel).not.toBeNull();
    });

    it('navigates to property record page when onselected event fires from tile', async () => {
        const element = createElement('c-my-favorites', { is: MyFavorites });
        document.body.appendChild(element);

        getFavorites.emit(mockGetFavorites);

        await flushPromises();

        const tile = element.shadowRoot.querySelector('c-property-tile');
        const mockPropertyId = mockGetFavorites[0].Id;
        tile.dispatchEvent(
            new CustomEvent('selected', { detail: mockPropertyId })
        );

        await flushPromises();

        const { pageReference } = getNavigateCalledWith();
        expect(pageReference.type).toBe('standard__recordPage');
        expect(pageReference.attributes.recordId).toBe(mockPropertyId);
        expect(pageReference.attributes.actionName).toBe('view');
    });
});
