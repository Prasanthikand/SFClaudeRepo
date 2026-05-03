import { createElement } from '@lwc/engine-dom';
import { getNavigateCalledWith } from 'lightning/navigation';
import BarcodeScanner from 'c/barcodeScanner';

// Mock various barcode functionality from mobileCapabilites.js
import {
    resetBarcodeScannerStubs,
    setBarcodeScannerAvailable,
    setUserCanceledScan,
    setBarcodeScanError
} from 'lightning/mobileCapabilities';

// Enable spying on toast event data
import { ShowToastEventName } from 'lightning/platformShowToastEvent';

describe('c-barcode-scanner-example', () => {
    afterEach(() => {
        // Reset the JSDOM instance shared across test cases in a single file
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }

        // Prevent data saved on mocks from leaking between tests
        jest.clearAllMocks();

        // Reset stubs
        resetBarcodeScannerStubs();
    });

    // Helper function to wait until the microtask queue is empty.
    // Used when having to wait for asynchronous/DOM updates.
    async function flushPromises() {
        return Promise.resolve();
    }

    it('directs the user to the mobile app when Barcode Scanner is unavailable', async () => {
        const elementBarcodeScanner = createElement(
            'c-barcode-scanner-example',
            { is: BarcodeScanner }
        );
        document.body.appendChild(elementBarcodeScanner);

        const elementScannerDirections =
            elementBarcodeScanner.shadowRoot.querySelector(
                '[data-test="scanner-directions"]'
            );

        expect(elementScannerDirections).not.toBeNull();
    });

    it('shows the `Scan QR Code` button when BarcodeScanner is available', async () => {
        const elementBarcodeScanner = createElement(
            'c-barcode-scanner-example',
            { is: BarcodeScanner }
        );
        setBarcodeScannerAvailable();

        document.body.appendChild(elementBarcodeScanner);

        const elementScanQRCodeButton =
            elementBarcodeScanner.shadowRoot.querySelector('lightning-button');

        expect(elementScanQRCodeButton).not.toBeNull();
    });

    it('navigates to the expected record view when a QR code is correctly scanned', async () => {
        const NAV_TYPE = 'standard__recordPage';
        const NAV_ACTION_NAME = 'view';
        const NAV_RECORD_ID = '0031700000pJRRWAA4';

        setBarcodeScannerAvailable();

        const elementBarcodeScanner = createElement(
            'c-barcode-scanner-example',
            { is: BarcodeScanner }
        );
        document.body.appendChild(elementBarcodeScanner);

        const elementScanQRCodeButton =
            elementBarcodeScanner.shadowRoot.querySelector('lightning-button');
        elementScanQRCodeButton.click();

        await flushPromises();

        const { pageReference } = getNavigateCalledWith();

        expect(pageReference.type).toBe(NAV_TYPE);
        expect(pageReference.attributes.actionName).toBe(NAV_ACTION_NAME);
        expect(pageReference.attributes.recordId).toBe(NAV_RECORD_ID);
    });

    it('triggers an error toast notification when the user cancels the scan', async () => {
        setBarcodeScannerAvailable();
        setUserCanceledScan();

        const toastEventSpy = jest.fn();

        const elementBarcodeScanner = createElement(
            'c-barcode-scanner-example',
            { is: BarcodeScanner }
        );
        document.body.appendChild(elementBarcodeScanner);

        elementBarcodeScanner.addEventListener(
            ShowToastEventName,
            toastEventSpy
        );

        const elementScanQRCodeButton =
            elementBarcodeScanner.shadowRoot.querySelector('lightning-button');
        elementScanQRCodeButton.click();

        await flushPromises();

        expect(toastEventSpy).toHaveBeenCalled();
        expect(toastEventSpy.mock.calls[0][0].detail.title).toBe(
            'Scanning Canceled'
        );
    });

    it('shows an error toast when there was a problem with the scan', async () => {
        setBarcodeScannerAvailable();
        setBarcodeScanError();

        const toastEventSpy = jest.fn();

        const elementBarcodeScanner = createElement(
            'c-barcode-scanner-example',
            {
                is: BarcodeScanner
            }
        );
        document.body.appendChild(elementBarcodeScanner);

        elementBarcodeScanner.addEventListener(
            ShowToastEventName,
            toastEventSpy
        );

        const elementScanQRCodeButton =
            elementBarcodeScanner.shadowRoot.querySelector('lightning-button');
        elementScanQRCodeButton.click();

        await flushPromises();

        expect(toastEventSpy).toHaveBeenCalled();
        expect(toastEventSpy.mock.calls[0][0].detail.title).toBe(
            'Barcode Scanner Error'
        );
    });
});