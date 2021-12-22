import api from '../api';
import * as arrayUtils from './array';
import rtrim from 'locutus/php/strings/rtrim';

let data;
let dataById;

export async function get(reportId = null) {
    !data && await init();

    if (reportId !== null) {
        return dataById[reportId];
    }

    return data;
}

async function init() {
    data = await api.loadReports({ __refs: true });
    dataById = arrayUtils.index(data, 'id');
}

export function getDetailUrlPath(navItem) {
    if (!navItem._url) return;

    let refUrlSegment = null;

    if (navItem.ref) {
        refUrlSegment = navItem.ref.url || navItem.ref.id;
    } else {
        if (navItem._report && navItem._report.ref) { // секция с привязанным отчетом
            refUrlSegment = navItem._report.ref.url || navItem._report.ref.id;
        }
    }

    if (refUrlSegment !== null) {
        const urlChunks = navItem._url.split('?');
        const path = rtrim(urlChunks[0], '/');
        return path + '/' + refUrlSegment;
    }
}

export function removeUnusedReportStyles() {
    /* Чистим кастомные стили ранее показанных табличных отчётов */

    const customStylesDataAttr = 'data-custom-report-styles'; // отличительный атрибут всех элементов с кастомными стилями
    const reportIdDataAttr = 'data-report-id'; // ID отчёта, к которому относится набор кастомных стилей

    document.querySelectorAll(`[${customStylesDataAttr}]`).forEach(stylesElem => {
        // Проверяем, существует ли таблица отчёта
        const reportId = stylesElem.dataset.reportId;
        const reportTableElem = document.querySelector(`table[${reportIdDataAttr}="${reportId}"]`);
        if (!reportTableElem) {
            stylesElem.remove();
        }
    });
}
