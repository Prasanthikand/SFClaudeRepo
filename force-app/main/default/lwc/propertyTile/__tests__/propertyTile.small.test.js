import { createElement } from '@lwc/engine-dom';
import PropertyTile from 'c/propertyTile';
import { getNavigateCalledWith } from 'lightning/navigation';

const PROPERTY = {
    City__c: 'Some City',
    Beds__c: '3',
    Baths__c: '1',
    Price__c: '450000',
    Thumbnail__c: 'some-property.jpg',
    Id: '12345'
};

jest.mock(
    '@salesforce/client/formFactor',
    () => { return { default: 'Small' }; },
    { virtual: true }
);

describe('c-property-tile', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    async function flushPromises() { return Promise.resolve(); }

    it('Navigates to property record page on click for Small formFactor', async () => {
        const NAV_TYPE = 'standard__recordPage';
        const NAV_ACTION_NAME = 'view';
        const NAV_OBJECT_API_NAME = 'Property__c';

        const element = createElement('c-property-tile', { is: PropertyTile });
        element.property = PROPERTY;
        document.body.appendChild(element);

        const anchorEl = element.shadowRoot.querySelector('a');
        anchorEl.click();
        await flushPromises();

        const { pageReference } = getNavigateCalledWith();
        expect(pageReference.type).toBe(NAV_TYPE);
        expect(pageReference.attributes.actionName).toBe(NAV_ACTION_NAME);
        expect(pageReference.attributes.objectApiName).toBe(NAV_OBJECT_API_NAME);
        expect(pageReference.attributes.recordId).toBe(PROPERTY.Id);
    });
});