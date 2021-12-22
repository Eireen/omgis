import { getFullCurrentPath } from './url';
import store from './store';

export function trackPageView(options) {
    const {
        referrerUrl,
        currentUrl,
        currentTitle,
        generationTime,
        newContent,
        error,  // : { code, originalError }
    } = options;

    let currUrl = currentUrl || getFullCurrentPath();
    let refUrl = referrerUrl || store.get('fullReferrerPath');
    if (!refUrl || refUrl === currUrl) { // Первая страница в сессии при прямом заходе
        refUrl = document.referrer;
    }

    const documentTitle = currentTitle
        // Для регистрации ошибки в Matomo нужно установить заголовок в особом формате - https://matomo.org/faq/how-to/faq_60/
        // Костыль: пока ставим 500-ю ошибку; TODO: посмотреть, можно ли заменить на FetchError.status
        || (error && `${error.code || 500}/URL = ${encodeURIComponent(currUrl)}/From = ${encodeURIComponent(refUrl)}`)
        || currUrl;

    // -- DEBUG -- //
    // console.log(`Page view: ${currUrl} from ${refUrl}`);
    // console.log(Object.assign({}, options, { currUrl, refUrl, documentTitle }));

    if (!window._paq) return; // analytics is not enabled

    let _paq = window._paq;

    _paq.push(['setReferrerUrl', refUrl]);
    _paq.push(['setCustomUrl', currUrl]);

    _paq.push(['setDocumentTitle', documentTitle]); // в Matomo title по умолчанию - URL

    // track performance
    _paq.push(['setGenerationTimeMs', Math.round(generationTime) || 0]);

    // remove all previously assigned custom variables
    _paq.push(['deleteCustomVariables', 'page']);
    _paq.push(['trackPageView']);

    // make Matomo aware of newly added content
    if (newContent) {
        trackDynamicContent(newContent);
    }
}

export function setUserAnalyticsData(user) {
    if (!window._paq || !user || !user.id) return;

    let _paq = window._paq;

    const userId = user.login || user.id;
    _paq.push(['setUserId', userId]);
}

export function clearUserAnalyticsData() {
    if (!window._paq) return;

    let _paq = window._paq;

    _paq.push(['resetUserId']);
}

export function trackDynamicContent(domNode) {
    if (!window._paq) return;

    let _paq = window._paq;

    _paq.push(['MediaAnalytics::scanForMedia', domNode]);
    _paq.push(['FormAnalytics::scanForForms', domNode]);
    _paq.push(['enableLinkTracking']);
}
