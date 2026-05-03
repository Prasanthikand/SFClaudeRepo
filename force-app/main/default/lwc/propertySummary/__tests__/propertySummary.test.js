import { createElement } from '@lwc/engine-dom';
import PropertySummary from 'c/propertySummary';
import { getRecord } from 'lightning/uiRecordApi';

const mockPropertyRecord = require('./data/getRecord.json');

describe('c-property-summary', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() { return Promise.resolve(); }

    it('renders an error panel when no property is selected', async () => {
        const element = createElement('c-property-summary', { is: PropertySummary });
        document.body.appendChild(element);
        await flushPromises();
        const panelEl = element.shadowRoot.querySelector('c-error-panel');
        expect(panelEl).not.toBeNull();
    });

    it('renders an error panel when getRecord returns an error', async () => {
        const element = createElement('c-property-summary', { is: PropertySummary });
        document.body.appendChild(element);
        getRecord.error();
        await flushPromises();
        const panelEl = element.shadowRoot.querySelector('c-error-panel');
        expect(panelEl).not.toBeNull();
    });

    it('renders a lightning-record-form when a property is selected', async () => {
        const element = createElement('c-property-summary', { is: PropertySummary });
        element.recordId = mockPropertyRecord.id;
        document.body.appendChild(element);
        getRecord.emit(mockPropertyRecord);
        await flushPromises();
        const formEl = element.shadowRoot.querySelector('lightning-record-form');
        expect(formEl).not.toBeNull();
        expect(formEl.recordId).toStrictEqual(mockPropertyRecord.id);
    });

    it('is accessible when property is selected', async () => {
        const element = createElement('c-property-summary', { is: PropertySummary });
        document.body.appendChild(element);
        getRecord.emit(mockPropertyRecord);
        await flushPromises();
        await expect(element).toBeAccessible();
    });

    it('is accessible when property is not selected', async () => {
        const element = createElement('c-property-summary', { is: PropertySummary });
        document.body.appendChild(element);
        await expect(element).toBeAccessible();
    });
});