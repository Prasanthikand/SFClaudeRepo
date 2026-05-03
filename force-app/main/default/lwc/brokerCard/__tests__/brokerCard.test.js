import { createElement } from '@lwc/engine-dom';
import BrokerCard from 'c/brokerCard';
import { getNavigateCalledWith } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

const mockGetPropertyRecord = require('./data/getPropertyRecord.json');

const BROKER_ID = 'a003h000003xlBiAAI';

const BROKER_FIELDS_INPUT = [
    {
        fieldApiName: 'Name',
        objectApiName: 'Broker__c'
    },
    {
        fieldApiName: 'Phone__c',
        objectApiName: 'Broker__c'
    },
    {
        fieldApiName: 'Mobile_Phone__c',
        objectApiName: 'Broker__c'
    },
    {
        fieldApiName: 'Email__c',
        objectApiName: 'Broker__c'
    }
];

describe('c-broker-card', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() {
        return Promise.resolve();
    }

    describe('broker record form', () => {
        it('gets property data from wire service', async () => {
            const element = createElement('c-broker-card', { is: BrokerCard });
            document.body.appendChild(element);
            getRecord.emit(mockGetPropertyRecord);
            await flushPromises();
            const propertyEl = element.shadowRoot.querySelector('lightning-record-form');
            expect(getFieldValue).toHaveBeenCalled();
            expect(propertyEl.recordId).toBe(BROKER_ID);
        });

        it('renders lightning-record-form with given input values', async () => {
            const element = createElement('c-broker-card', { is: BrokerCard });
            document.body.appendChild(element);
            getRecord.emit(mockGetPropertyRecord);
            await flushPromises();
            const propertyEl = element.shadowRoot.querySelector('lightning-record-form');
            expect(propertyEl.fields).toEqual(BROKER_FIELDS_INPUT);
            expect(propertyEl.recordId).toBe(BROKER_ID);
        });
    });

    describe('navigate to broker record', () => {
        it('navigates to record view', async () => {
            const NAV_TYPE = 'standard__recordPage';
            const NAV_OBJECT_API_NAME = 'Property__c';
            const NAV_ACTION_NAME = 'view';
            const NAV_RECORD_ID = BROKER_ID;

            const element = createElement('c-broker-card', { is: BrokerCard });
            document.body.appendChild(element);
            getRecord.emit(mockGetPropertyRecord);
            await flushPromises();

            const buttonEl = element.shadowRoot.querySelector('lightning-button-icon');
            buttonEl.click();

            const { pageReference } = getNavigateCalledWith();
            expect(pageReference.type).toBe(NAV_TYPE);
            expect(pageReference.attributes.objectApiName).toBe(NAV_OBJECT_API_NAME);
            expect(pageReference.attributes.actionName).toBe(NAV_ACTION_NAME);
            expect(pageReference.attributes.recordId).toBe(NAV_RECORD_ID);
        });
    });

    describe('error panel', () => {
        it('renders error if data is not retrieved successfully', async () => {
            const WIRE_ERROR = 'Something bad happened';
            const element = createElement('c-broker-card', { is: BrokerCard });
            document.body.appendChild(element);
            getRecord.error(WIRE_ERROR);
            await flushPromises();
            const errorPanelEl = element.shadowRoot.querySelector('c-error-panel');
            expect(errorPanelEl).not.toBeNull();
            expect(errorPanelEl.errors.body).toBe(WIRE_ERROR);
            expect(errorPanelEl.friendlyMessage).toBe('Error retrieving data');
        });
    });
});