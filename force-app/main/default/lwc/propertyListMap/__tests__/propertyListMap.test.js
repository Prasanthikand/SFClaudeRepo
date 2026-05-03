import { createElement } from '@lwc/engine-dom';
import PropertyListMap from 'c/propertyListMap';
import getPagedPropertyList from '@salesforce/apex/PropertyController.getPagedPropertyList';
import { subscribe } from 'lightning/messageService';
import FILTERS_CHANGED from '@salesforce/messageChannel/FiltersChange__c';
import { ShowToastEventName } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

jest.mock(
    '@salesforce/apex/PropertyController.getPagedPropertyList',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

const MOCK_PROPERTIES = {
    records: [
        { Id: 'id1', Location__Latitude__s: 10, Location__Longitude__s: 11 },
        { Id: 'id2', Location__Latitude__s: 20, Location__Longitude__s: 21 }
    ]
};

const LOAD_SCRIPT_ERROR = {
    body: { message: 'Mock load script error has occurred' },
    ok: false,
    status: 400,
    statusText: 'Bad Request'
};

const LEAFLET_STUB = {
    map: () => ({ setView: () => {}, scrollWheelZoom: { disable: () => {} }, removeLayer: () => {} }),
    tileLayer: () => ({ addTo: () => {} }),
    divIcon: () => {},
    marker: () => ({ on: () => {}, bindTooltip: () => {} }),
    layerGroup: () => ({ addTo: () => {} })
};

describe('c-property-list-map', () => {
    beforeEach(() => { global.L = LEAFLET_STUB; });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.resetAllMocks();
        global.L = undefined;
    });

    async function flushPromises() { return Promise.resolve(); }

    it('registers propertyFilters subscriber during the component lifecycle', () => {
        const element = createElement('c-property-list-map', { is: PropertyListMap });
        document.body.appendChild(element);
        expect(subscribe).toHaveBeenCalled();
        expect(subscribe.mock.calls[0][1]).toBe(FILTERS_CHANGED);
    });

    it('loads the leaflet javascript and css static resources', () => {
        const element = createElement('c-property-list-map', { is: PropertyListMap });
        document.body.appendChild(element);
        expect(loadScript.mock.calls.length).toBe(1);
        expect(loadStyle.mock.calls.length).toBe(1);
        expect(loadScript.mock.calls[0][1]).toEqual('leafletjs/leaflet.js');
        expect(loadStyle.mock.calls[0][1]).toEqual('leafletjs/leaflet.css');
    });

    it('fires a toast event if the static resource cannot be loaded', async () => {
        loadScript.mockRejectedValue(LOAD_SCRIPT_ERROR);
        const element = createElement('c-property-list-map', { is: PropertyListMap });
        document.body.appendChild(element);
        const handler = jest.fn();
        element.addEventListener(ShowToastEventName, handler);
        await flushPromises();
        await flushPromises();
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.title).toBe('Error while loading Leaflet');
        expect(handler.mock.calls[0][0].detail.variant).toBe('error');
    });

    it('fires a toast event when properties cannot be retrieved', async () => {
        const element = createElement('c-property-list-map', { is: PropertyListMap });
        document.body.appendChild(element);
        const handler = jest.fn();
        element.addEventListener(ShowToastEventName, handler);
        getPagedPropertyList.error();
        await flushPromises();
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.title).toBe('Error loading properties');
        expect(handler.mock.calls[0][0].detail.variant).toBe('error');
    });
});