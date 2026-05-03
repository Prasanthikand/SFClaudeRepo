import { createElement } from '@lwc/engine-dom';
import Paginator from 'c/paginator';

describe('c-paginator', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    async function flushPromises() {
        return Promise.resolve();
    }

    it('sends "next" event on button click', async () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 1;
        element.pageSize = 10;
        element.totalItemCount = 100;
        document.body.appendChild(element);

        const handlerNext = jest.fn();
        element.addEventListener('next', handlerNext);

        const nextButtonEl = element.shadowRoot.querySelector('.right-button-icon');
        nextButtonEl.click();
        await flushPromises();

        expect(handlerNext.mock.calls.length).toBe(1);
        const prevButtonEl = element.shadowRoot.querySelector('.left-button-icon');
        expect(prevButtonEl).toBeNull();
    });

    it('sends "previous" event on button click', async () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 10;
        element.pageSize = 10;
        element.totalItemCount = 100;
        document.body.appendChild(element);

        const handlerPrevious = jest.fn();
        element.addEventListener('previous', handlerPrevious);

        const prevButtonEl = element.shadowRoot.querySelector('.left-button-icon');
        prevButtonEl.click();
        await flushPromises();

        expect(handlerPrevious.mock.calls.length).toBe(1);
        const nextButtonEl = element.shadowRoot.querySelector('.right-button-icon');
        expect(nextButtonEl).toBeNull();
    });

    it('displays total item count, page number, and number of pages with zero items', () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 0;
        element.pageSize = 9;
        element.totalItemCount = 0;
        document.body.appendChild(element);
        const lightningLayoutItemEl = element.shadowRoot.querySelector('.nav-info');
        expect(lightningLayoutItemEl).not.toBeNull();
        expect(lightningLayoutItemEl.textContent).toBe('0 items • page 0 of 0');
    });

    it('displays total item count, page number, and number of pages with some items', async () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 1;
        element.pageSize = 9;
        element.totalItemCount = 12;
        document.body.appendChild(element);
        const lightningLayoutItemEl = element.shadowRoot.querySelector('.nav-info');
        await flushPromises();
        expect(lightningLayoutItemEl).not.toBeNull();
        expect(lightningLayoutItemEl.textContent).toBe('12 items • page 1 of 2');
    });

    it('does not display next page button when reaching max page offset', async () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 200;
        element.pageSize = 10;
        element.totalItemCount = 12;
        document.body.appendChild(element);
        await flushPromises();
        const btnNextEl = element.shadowRoot.querySelector('.nav-next lightning-button-icon');
        expect(btnNextEl).toBeNull();
    });

    it('is accessible', async () => {
        const element = createElement('c-paginator', { is: Paginator });
        element.pageNumber = 3;
        element.pageSize = 9;
        element.totalItemCount = 12;
        document.body.appendChild(element);
        await expect(element).toBeAccessible();
    });
});