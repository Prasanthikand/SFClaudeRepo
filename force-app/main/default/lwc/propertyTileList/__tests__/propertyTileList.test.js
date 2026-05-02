import { createElement } from '@lwc/engine-dom';
import PropertyTileList from 'c/propertyTileList';
import getPagedPropertyList from '@salesforce/apex/PropertyController.getPagedPropertyList';
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import FILTERSCHANGEMC from '@salesforce/messageChannel/FiltersChange__c';
import PROPERTYSELECTEDMC from '@salesforce/messageChannel/PropertySelected__c';

const mockgetPagedPropertyList = require('./data/getPagedPropertyList.json');

jest.mock(
    '@salesforce/apex/PropertyController.getPagedPropertyList',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

describe('c-property-tile-list', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() { return Promise.resolve(); }

    describe('@wire data', () => {
        it('renders properties when data returned', async () => {
            const element = createElement('c-property-tile-list', { is: PropertyTileList });
            document.body.appendChild(element);
            getPagedPropertyList.emit(mockgetPagedPropertyList);
            await flushPromises();
            const propertyTileEls = element.shadowRoot.querySelectorAll('c-property-tile');
            expect(propertyTileEls.length).toBe(mockgetPagedPropertyList.records.length);
        });

        it('renders error panel when error returned', async () => {
            const element = createElement('c-property-tile-list', { is: PropertyTileList });
            document.body.appendChild(element);
            getPagedPropertyList.error();
            await flushPromises();
            const errorPanelEl = element.shadowRoot.querySelector('c-error-panel');
            expect(errorPanelEl).not.toBeNull();
        });
    });

    it('registers propertyFilters subscriber during the component lifecycle', () => {
        const element = createElement('c-property-tile-list', { is: PropertyTileList });
        document.body.appendChild(element);
        expect(subscribe).toHaveBeenCalled();
        expect(subscribe.mock.calls[0][1]).toBe(FILTERSCHANGEMC);
    });

    it('sends propertySelected event when c-property-tile selected', async () => {
        const element = createElement('c-property-tile-list', { is: PropertyTileList });
        document.body.appendChild(element);
        getPagedPropertyList.emit(mockgetPagedPropertyList);
        await flushPromises();
        const propertyTile = element.shadowRoot.querySelector('c-property-tile');
        propertyTile.dispatchEvent(new CustomEvent('selected'));
        expect(publish).toHaveBeenCalledWith(undefined, PROPERTYSELECTEDMC, { propertyId: null });
    });
});