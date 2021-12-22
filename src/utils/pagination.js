import rtrim from 'locutus/php/strings/rtrim';
import store from './store';

/**
 * Генерирует HTML-код списка ссылок на страницы в виде: 1...5 6 7...10
 * @param number  totalItemCount общее количество элементов
 * @return string  pagination HTML
 *
 * TODO: refactor - дублируется в компоненте ReportPagination
 */
export function htmlList(totalItemCount, currentPage, pageSize = 50)
{
    const totalPageCount = ceil(totalItemCount / pageSize);
    const pageNumbersCount = 3;
    const currentLocation = store.get('currentLocation');

    const currentRelativeUrl = currentLocation.pathname + currentLocation.search + currentLocation.hash;

    let basePath = currentRelativeUrl.replace(/[\?&]page=\d+/, '');
    basePath = !~basePath.indexOf('?')
        ? rtrim(basePath, '?') + '?'
        : basePath + '&';

    let paginationHtml = '';

    if (currentPage > pageNumbersCount) {
        paginationHtml += `<li><a href="${rtrim(basePath, '?&')}">1</a></li>`;
    }

    if (currentPage > totalPageCount) {
        currentPage = totalPageCount;
    }

    let startNumber, endNumber;

    if (totalPageCount > 1) {
        startNumber = Math.floor((currentPage - 1) / pageNumbersCount) * pageNumbersCount + 1;

        if (totalPageCount < startNumber + pageNumbersCount - 1) {
            endNumber = totalPageCount;
        } else {
            endNumber = startNumber + pageNumbersCount - 1;
        }

        if (endNumber - startNumber < pageNumbersCount - 1 && endNumber > pageNumbersCount - 1) {
            startNumber = endNumber - (pageNumbersCount - 1);
        }

        if (startNumber != 1) {
            paginationHtml += `<li><a href="${basePath}page=${startNumber - 1}">&hellip;</a></li>`;
        }

        for (let i = startNumber; i <= endNumber; i++) {
            if (i == currentPage) {
                paginationHtml += `<li class="active">${i}</li>`;
            } else {
                paginationHtml += `<li><a href="${basePath}page=${i}">${i}</a></li>`;
            }
        };
        if (totalPageCount > endNumber) {
            paginationHtml += `<li><a href="${basePath}page=${endNumber + 1}">&hellip;</a></li>`;
        }
    }

    if (currentPage < totalPageCount - pageNumbersCount) {
        paginationHtml += `<li><a href="${basePath}page=${totalPageCount}">${totalPageCount}</a></li>`;
    }

    return paginationHtml;
}
