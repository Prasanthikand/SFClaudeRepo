import { createElement } from '@lwc/engine-dom';
import DaysOnMarket from 'c/daysOnMarket';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import {
    subscribe,
    MessageContext,
    publish,
    unsubscribe
} from 'lightning/messageService';
import PROPERTYSELECTEDMC from '@salesforce/messageChannel/PropertySelected__c';
import DATE_LISTED_FIELD from '@salesforce/schema/Property__c.Date_Listed__c';
import DAYS_ON_MARKET_FIELD from '@salesforce/schema/Property__c.Days_On_Market__c';

const MAX_DAYS_CHART = 90;
const mockGetRecord = require('./data/getRecord.json');

describe('c-days-on-market', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() {
        return Promise.resolve();
    }

    it('renders error if no property is selected', () => {
        const element = createElement('c-days-on-market', { is: DaysOnMarket });
        document.body.appendChild(element);
        const errorPanelElement = element.shadowRoot.querySelector('c-error-panel');
        expect(errorPanelElement.friendlyMessage).toBe(
            'Select a property to see days on the market'
        );
    });

    it('registers the LMS subscriber during the component lifecycle', () => {
        const element = createElement('c-days-on-market', { is: DaysOnMarket });
        document.body.appendChild(element);
        expect(subscribe).toHaveBeenCalled();
        expect(subscribe.mock.calls[0][1]).toBe(PROPERTYSELECTEDMC);
    });

    it('unregisters the LMS subscriber during the component lifecycle', () => {
        const element = createElement('c-days-on-market', { is: DaysOnMarket });
        document.body.appendChild(element);
        document.body.removeChild(element);
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('invokes getRecord with the published message payload value', async () => {
        const element = createElement('c-days-on-market', { is: DaysOnMarket });
        document.body.appendChild(element);
        const messagePayload = { propertyId: '001' };
        publish(MessageContext, PROPERTYSELECTEDMC, messagePayload);
        await flushPromises();
        const { propertyId, fields } = getRecord.getLastConfig();
        expect(propertyId).toEqual(messagePayload.recordId);
        expect(fields).toEqual([DATE_LISTED_FIELD, DAYS_ON_MARKET_FIELD]);
    });

    describe('getRecord @wire data', () => {
        function validateHTML(element, type) {
            const badgeEl = element.shadowRoot.querySelector(`div.badge.${type}`);
            expect(badgeEl).not.toBeNull();
            const daysDivEl = element.shadowRoot.querySelector('div.days');
            expect(daysDivEl.textContent).toBe(
                getFieldValue(mockGetRecord, DAYS_ON_MARKET_FIELD).toString()
            );
            const chartBarEl = element.shadowRoot.querySelector(`div.bar.${type}`);
            expect(chartBarEl).not.toBeNull();
            const width = (getFieldValue(mockGetRecord, DAYS_ON_MARKET_FIELD) / MAX_DAYS_CHART) * 100;
            expect(chartBarEl.style.width).toBe(`${width}%`);
            const formattedDateTimeEl = element.shadowRoot.querySelector('lightning-formatted-date-time');
            expect(formattedDateTimeEl.value).toBe(
                getFieldValue(mockGetRecord, DATE_LISTED_FIELD).toString()
            );
        }

        describe('renders days on market', () => {
            // eslint-disable-next-line jest/expect-expect
            it('in normal case', async () => {
                const element = createElement('c-days-on-market', { is: DaysOnMarket });
                element.recordId = '001';
                document.body.appendChild(element);
                getRecord.emit(mockGetRecord);
                await flushPromises();
                validateHTML(element, 'normal');
            });

            // eslint-disable-next-line jest/expect-expect
            it('in warning case', async () => {
                const element = createElement('c-days-on-market', { is: DaysOnMarket });
                element.recordId = '001';
                document.body.appendChild(element);
                mockGetRecord.fields.Days_On_Market__c.value = 48;
                getRecord.emit(mockGetRecord);
                await flushPromises();
                validateHTML(element, 'warning');
            });

            // eslint-disable-next-line jest/expect-expect
            it('in alert case', async () => {
                const element = createElement('c-days-on-market', { is: DaysOnMarket });
                element.recordId = '001';
                document.body.appendChild(element);
                mockGetRecord.fields.Days_On_Market__c.value = 68;
                getRecord.emit(mockGetRecord);
                await flushPromises();
                validateHTML(element, 'alert');
            });
        });
    });

    describe('getRecord @wire error', () => {
        it('renders an error panel when there is an error', async () => {
            const APEX_ERROR = { body: 'Error retrieving records', ok: false, status: '400', statusText: 'Bad Request' };
            const element = createElement('c-days-on-market', { is: DaysOnMarket });
            element.recordId = '001';
            document.body.appendChild(element);
            getRecord.error(APEX_ERROR.body, APEX_ERROR.status, APEX_ERROR.statusText);
            await flushPromises();
            const errorPanelEl = element.shadowRoot.querySelector('c-error-panel');
            expect(errorPanelEl).not.toBeNull();
            expect(errorPanelEl.errors).toStrictEqual(APEX_ERROR);
        });
    });
});