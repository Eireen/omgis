/* Полифилл FormData для iOS пока отключен, т.к. ломал форму входа (TypeError).
Добавлялся в commit 1b9c83c0202acd2e4dd9a60c962c51ae1b32f8d2 (см. подробности там) */
//import * as FormDataPolyfill from 'formdata-polyfill';
import appConfig from './config.json';
import FetchError from './utils/FetchError';
import fetch from 'isomorphic-fetch';
import qs from 'qs';
import store from './utils/store';
import User from './user/User';

const globalParameters = ['test', 'version', 'v'];

function buildFormData(data) {
    let formData = new FormData();
    for (let key in data) {
        if (Array.isArray(data[key])) {
            let formDataKey = key[key.length - 1] === ']'
                ? key
                : key + '[]';
            for (let i = 0, l = data[key].length; i < l; i++) {
                formData.append(formDataKey, data[key][i]);
            }
        } else {
            formData.append(key, data[key]);
        }
    }
    return formData;
}

function buildQueryString(params) {
    let queryString = qs.stringify(params);
    if (queryString) queryString = '?' + queryString;
    return queryString;
}

async function getFinalUrl(route, params = {}, baseUrl = null, isRouteFullPath = false) {
    // isRouteFullPath равен true в случае, когда route представляет собой URL, включающий host-часть
    // (то есть не нужно комбинировать URL из baseUrl и route, а нужно только добавить параметры)
    // TODO: подумать над этим костылём

    const resultParams = Object.assign({}, params, { v: appConfig.apiVersion });
    const queryString = buildQueryString(resultParams);

    if (isRouteFullPath) {
        const finalBaseUrl = route;

        return ~route.indexOf('?')
            ? `${finalBaseUrl}&${queryString.slice(1)}`
            : `${finalBaseUrl}${queryString}`;
    } else {
        const finalBaseUrl = baseUrl || appConfig.apiProvider;

        return ~route.indexOf('?')
            ? `${finalBaseUrl}/${route}&${queryString.slice(1)}`
            : `${finalBaseUrl}/${route}${queryString}`;
    }
}

async function sendPayloadRequest(route, params, options) { // общий код для методов POST и PUT
    const finalUrl = await getFinalUrl(route, params);

    const response = await fetch(finalUrl, options);

    if (!response.ok) {
        // TODO: REFACTOR - copypasted from get()
        let responseText, responseJson;
        try {
            responseText = await response.text();
            responseJson = JSON.parse(responseText);
        } catch (err) {}
        throw new FetchError(response, null, responseText, responseJson);
    }

    return await response.json();
}

export default {
    async loadMapLayerCatalog() {
        return await this.get('', { request: 'getLayers' }, false, appConfig.wmsBaseUrl);
    },

    async loadMapLayers(params) {
        // используем POST, т.к. params могут быть "жирными" и вызывать "414 Request-URI Too Large"
        const response = await this.post('map/layers', params);
        const result = new Map();
        for (let layer of response) {
            result.set(`${layer.id}`, layer);
        }
        return result;
    },

    async loadMapLayer(layerId, extraParams = {}) {
        const params = Object.assign({ layerIds: [ layerId ] }, extraParams);
        const response = await this.get('map/layers', params);

        for (let layer of response) {
            if (`${layer.id}` === `${layerId}`) {
                return layer;
            }
        }

        return null;
    },

    /* Подготавливает все GET-параметры для передачи в роуты отчетов -
    а именно, раскрывает filter[] и вливает в query
    TODO: убрать раскрытие filter[], т.к. параметры больше не оборачиваются в filter[] */
    prepareAllGetParams() {
        const currentQuery = qs.parse(this.currentLocation.search.replace(/^\?/, ''));
        let query = currentQuery;
        let result;

        // Раскрываем параметры из filter[]
        if (query.filter && query.filter.length) {
            result = query.filter;
            delete query.filter;
        } else {
            result = [];
        }

        return Object.assign(query, result); // поля из filter[] считаем первичнее одноименных вне filter[]
    },

    addGlobalParams(params) {
        const currentQuery = qs.parse(this.currentLocation.search.replace(/^\?/, ''));
        for (let globalParam of globalParameters) {
            if (currentQuery[globalParam] !== undefined) {
                params[globalParam] = currentQuery[globalParam];
            } 
        }
        return params;
    },

    async downloadFile(url, filename, finishCallback) { // Скачивает файл и инициирует загрузку по Blob URL
        let options = {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${User.token}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        };
        this.addProfilingHeaders(options.headers);

        let response;
        try {
            response = await fetch(url, options);
        } finally {
            if (finishCallback) finishCallback();
        }

        if (!response.ok) {
            const responseText = `Cannot download file ${url}`;
            throw new FetchError(response, null, responseText);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        /* Чтобы загрузить Blob URL с человекочитаемым именем файла, приходится создавать ссылку с атрибутом `download`,
        см. https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link */
        const link = document.createElement('a');
        document.body.appendChild(link);
        link.href = blobUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        link.remove();
    },

    get currentLocation() {
        return store.get('currentLocation');
    },

    addProfilingHeaders(resultHeaders) { // `resultHeaders` is a header list from `fetch` options
        this.addHeadersFromLocalStorage(resultHeaders, [
            {
                fieldName: 'apiProfilingToken',
                headerName: 'X-Profiling-Token'
            },
            {
                fieldName: 'apiProfilingNamespace',
                headerName: 'X-Profiling-Namespace'
            }
        ]);
    },

    addHeadersFromLocalStorage(resultHeaders, headersConfig) { // `headersOption` is a header list from `fetch` options
        for (let { fieldName, headerName } of headersConfig) {
            const fieldValue = localStorage.getItem(fieldName);
            if (!fieldValue) continue;
            resultHeaders[headerName] = fieldValue;
        }
    },

    async get(route, params = {}, withToken = true, baseUrl = null, isRouteFullPath = false) {
        // isRouteFullPath равен true в случае, когда route представляет собой URL, включающий host-часть
        // (то есть не нужно комбинировать URL из baseUrl и route, а нужно только добавить параметры)
        // TODO: подумать над этим костылём

        const finalUrl = await getFinalUrl(route, params, baseUrl, isRouteFullPath);

        let options = {
            mode: 'cors',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        };
        if (withToken) {
            options.headers.Authorization = 'Bearer ' + User.token;
        }
        this.addProfilingHeaders(options.headers);

        const response = await fetch(finalUrl, options);
        if (!response.ok) {
            // TODO: ПЕРЕПИСАТЬ - ниже код получения текста ответа дублируется
            let responseText, responseJson;
            try {
                responseText = await response.text();
                responseJson = JSON.parse(responseText);
            } catch (err) {}
            throw new FetchError(response, null, responseText, responseJson);
        }

        let responseText = await response.text(); // получить ответ у fetch можно только единожды (т.е. вызвать text() в обработчике ошибки после json() не получится)
        let responseJson;
        try {
            responseJson = JSON.parse(responseText);
        } catch (error) {
            throw new Error(responseText);
        }
        return responseJson;
    },

    async post(route, data = {}, params = {}, requestOptions = {}, withToken = true) {
        const formData = buildFormData(data);

        const options = Object.assign({
            method: 'POST',
            body: formData,
            mode: 'cors',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        }, requestOptions); // requestOptions используется, например, для включения отправки кук при авторизационном CORS-запросе
        if (withToken) {
            options.headers.Authorization = 'Bearer ' + User.token;
        }
        this.addProfilingHeaders(options.headers);

        return await sendPayloadRequest(route, params, options);
    },

    async put(route, data = {}, params = {}) {
        const formData = buildFormData(data);

        const options = {
            method: 'PUT',
            body: formData,
            mode: 'cors',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Authorization': 'Bearer ' + User.token
            }
        };
        this.addProfilingHeaders(options.headers);

        return await sendPayloadRequest(route, params, options);
    }
}
