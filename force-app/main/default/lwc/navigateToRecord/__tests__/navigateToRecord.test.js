import { createElement } from '@lwc/engine-dom';
import NavigateToRecord from 'c/navigateToRecord';
import { getNavigateCalledWith } from 'lightning/navigation';

describe('c-navigate-to-record', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    async function flushPromises() {
        return Promise.resolve();
    }

    it('navigates to record view', async () => {
        const NAV_TYPE = 'standard__recordPage';
        const NAV_ACTION_NAME = 'view';
        const NAV_RECORD_ID = '0031700000pJRRWAA4';

        const element = createElement('c-navigate-to-record', { is: NavigateToRecord });
        element.recordId = NAV_RECORD_ID;
        document.body.appendChild(element);

        await flushPromises();

        const { pageReference } = getNavigateCalledWith();
        expect(pageReference.type).toBe(NAV_TYPE);
        expect(pageReference.attributes.actionName).toBe(NAV_ACTION_NAME);
        expect(pageReference.attributes.recordId).toBe(NAV_RECORD_ID);
    });
});