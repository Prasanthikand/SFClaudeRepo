import { createElement } from '@lwc/engine-dom';
import SampleDataImporter from 'c/sampleDataImporter';
import { ShowToastEventName } from 'lightning/platformShowToastEvent';
import importSampleData from '@salesforce/apex/SampleDataController.importSampleData';

jest.mock(
    '@salesforce/apex/SampleDataController.importSampleData',
    () => { return { default: jest.fn() }; },
    { virtual: true }
);

const APEX_OPERATION_SUCCESS = null;
const APEX_OPERATION_ERROR = { message: 'An internal server error has occurred' };

describe('c-sample-data-importer', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() { return Promise.resolve(); }

    it('fires success event when importSampleData runs successfully', async () => {
        importSampleData.mockResolvedValue(APEX_OPERATION_SUCCESS);
        const element = createElement('c-sample-data-importer', { is: SampleDataImporter });
        document.body.appendChild(element);
        const handler = jest.fn();
        element.addEventListener(ShowToastEventName, handler);
        const buttonEl = element.shadowRoot.querySelector('lightning-button');
        buttonEl.click();
        await flushPromises();
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.variant).toBe('success');
        expect(handler.mock.calls[0][0].detail.title).toBe('Success');
        expect(handler.mock.calls[0][0].detail.message).toBe('Sample data successfully imported');
    });

    it('fires error event when importSampleData runs with error', async () => {
        importSampleData.mockRejectedValue(APEX_OPERATION_ERROR);
        const element = createElement('c-sample-data-importer', { is: SampleDataImporter });
        document.body.appendChild(element);
        const handler = jest.fn();
        element.addEventListener(ShowToastEventName, handler);
        const buttonEl = element.shadowRoot.querySelector('lightning-button');
        buttonEl.click();
        await flushPromises();
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].detail.variant).toBe('error');
        expect(handler.mock.calls[0][0].detail.title).toBe('Error while importing data');
        expect(handler.mock.calls[0][0].detail.message).toBe(APEX_OPERATION_ERROR.message);
    });

    it('is accessible', async () => {
        const element = createElement('c-sample-data-importer', { is: SampleDataImporter });
        document.body.appendChild(element);
        await expect(element).toBeAccessible();
    });
});