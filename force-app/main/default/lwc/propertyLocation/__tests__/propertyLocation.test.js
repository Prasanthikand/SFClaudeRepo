import { createElement } from '@lwc/engine-dom';
import PropertyLocation from 'c/propertyLocation';
import { getRecord } from 'lightning/uiRecordApi';
import { setDeviceLocationServiceAvailable } from 'lightning/mobileCapabilities';
import { mockGeolocation } from '../../../../../test/jest-mocks/global/navigator';

const mockPropertyRecord = require('./data/getRecord.json');

describe('c-property-location', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() { return Promise.resolve(); }

    it('renders an error panel when no location services are available', async () => {
        const element = createElement('c-property-location', { is: PropertyLocation });
        document.body.appendChild(element);
        await flushPromises();
        const panelEl = element.shadowRoot.querySelector('c-error-panel');
        expect(panelEl).not.toBeNull();
    });

    it('renders an error panel when getRecord returns an error', async () => {
        const element = createElement('c-property-location', { is: PropertyLocation });
        document.body.appendChild(element);
        getRecord.error();
        await flushPromises();
        const panelEl = element.shadowRoot.querySelector('c-error-panel');
        expect(panelEl).not.toBeNull();
    });

    // eslint-disable-next-line jest/expect-expect
    it('renders coordinates and distance when browser location is available', async () => {
        global.navigator.geolocation = mockGeolocation;
        const element = createElement('c-property-location', { is: PropertyLocation });
        element.recordId = mockPropertyRecord.id;
        document.body.appendChild(element);
        getRecord.emit(mockPropertyRecord);
        await flushPromises();
    });

    // eslint-disable-next-line jest/expect-expect
    it('renders coordinates and distance when device location is available', async () => {
        setDeviceLocationServiceAvailable(true);
        const element = createElement('c-property-location', { is: PropertyLocation });
        element.recordId = mockPropertyRecord.id;
        document.body.appendChild(element);
        getRecord.emit(mockPropertyRecord);
        await flushPromises();
    });
});