import { createElement } from '@lwc/engine-dom';
import PropertyFilter from 'c/propertyFilter';
import { publish } from 'lightning/messageService';
import FILTERSCHANGEMC from '@salesforce/messageChannel/FiltersChange__c';

const MAX_PRICE = 1200000;
const DEFAULT_SEARCH_CRITERIA = { searchKey: '', maxPrice: MAX_PRICE, minBedrooms: 0, minBathrooms: 0 };

describe('c-property-filter', () => {
    beforeAll(() => { jest.useFakeTimers(); });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() { return Promise.resolve(); }

    it('fires the change event on new search input', async () => {
        const element = createElement('c-property-filter', { is: PropertyFilter });
        document.body.appendChild(element);
        const lightningInputEl = element.shadowRoot.querySelector('lightning-input');
        lightningInputEl.dispatchEvent(new CustomEvent('change', { detail: { value: 'Boston' } }));
        jest.runAllTimers();
        const SEARCH_CRITERIA = { searchKey: 'Boston', maxPrice: MAX_PRICE, minBedrooms: 0, minBathrooms: 0 };
        await flushPromises();
        expect(publish).toHaveBeenCalledWith(undefined, FILTERSCHANGEMC, SEARCH_CRITERIA);
    });

    it('fires the change event on Max Price slider input', async () => {
        const element = createElement('c-property-filter', { is: PropertyFilter });
        document.body.appendChild(element);
        const lightningSliderEl = element.shadowRoot.querySelector('lightning-slider');
        lightningSliderEl.dispatchEvent(new CustomEvent('change', { detail: { value: 60000 } }));
        jest.runAllTimers();
        const SEARCH_CRITERIA = { searchKey: '', maxPrice: 60000, minBedrooms: 0, minBathrooms: 0 };
        await flushPromises();
        expect(publish).toHaveBeenCalledWith(undefined, FILTERSCHANGEMC, SEARCH_CRITERIA);
    });

    it('fires change event when reset button is clicked', async () => {
        const element = createElement('c-property-filter', { is: PropertyFilter });
        document.body.appendChild(element);
        const lightningButtonEl = element.shadowRoot.querySelector('lightning-button');
        lightningButtonEl.click();
        jest.runAllTimers();
        await flushPromises();
        expect(publish).toHaveBeenCalledWith(undefined, FILTERSCHANGEMC, DEFAULT_SEARCH_CRITERIA);
    });
});