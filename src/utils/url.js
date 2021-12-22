import { arrayDiff } from './array';
import parse_url from 'locutus/php/url/parse_url';
import rawurlencode from 'locutus/php/url/rawurlencode';
import http_build_query from 'locutus/php/url/http_build_query';

export function buildQueryString(params) {
    var queryString = '',
        value, param;

    for (param in params) {
        value = params[param];
        if (queryString) {
            queryString += '&';
        }
        queryString += encodeURIComponent(param) + '=' + encodeURIComponent(value);
    }

    return '?' + queryString;
}

/* Пропускает через rawurlencode path-сегменты URL, например:
http://gs.msk.mosreg.ru/Lists/DocLib/Заседание №48 от 22.12.2015/Вопрос №3/2. Паспорт Двина.xlsx
=>
http://gs.msk.mosreg.ru/Lists/DocLib/%D0%97%D0%B0%D1%81%D0%B5%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5%20%E2%84%9648%20%D0%BE%D1%82%2022.12.2015/%D0%92%D0%BE%D0%BF%D1%80%D0%BE%D1%81%20%E2%84%963/2.%20%D0%9F%D0%B0%D1%81%D0%BF%D0%BE%D1%80%D1%82%20%D0%94%D0%B2%D0%B8%D0%BD%D0%B0.xlsx */
export function urlencodePathChunks(url) {
    const parsedUrl = parse_url(url);

    if (!parsedUrl) return '';

    const encodedPathChunks = [];
    for (let pathChunk of parsedUrl.path.split('/')) {
        encodedPathChunks.push(rawurlencode(pathChunk));
    }

    return (
        parsedUrl.scheme +
        '://' +
        parsedUrl.host +
        (parsedUrl.port ? ':' + parsedUrl.port : '') +
        encodedPathChunks.join('/') +
        (parsedUrl.query ? '?' + parsedUrl.query : '') +
        (parsedUrl.fragment ? '#' + parsedUrl.fragment : '')
    );
}

/* Проверяет, является ли строка URL-ом, простой проверкой наличия протокола или // в начале строки */
export function isHttpUrl(string) {
    return /^(?:https?:\/\/|\/\/).+/.test(string);
}

export function relative2Absolute(rel, base) {
    if (!rel) return base;

    /* return if already absolute URL */
    if (parse_url(rel, 'PHP_URL_SCHEME')) return rel;

    /* queries and anchors */
    if (rel[0] ==='#' || rel[0] ==='?') return base + rel;

    /* parse base URL and convert to local variables:
       'scheme', 'host', 'path' */
    let { scheme, host, port = '', path = '' } = parse_url(base);

    /* remove non-directory element from path */
    path = path.replace(/\/[^\/]*$/g, '');

    /* destroy path if relative url points to root */
    if (rel[0] === '/') path = '';

    if (port) port = ':' + port;

    /* dirty absolute URL */
    let abs = `${host}${port}${path}/${rel}`;

    /* replace '//' or '/./' or '/foo/../' with '/' */
    const re = [
        /(\/\.?\/)/g,
        /\/(?!\.\.)[^\/]+\/\.\.\//g
    ];
    for (let regex of re) {
        while (regex.test(abs)) {
            abs = abs.replace(regex, '/');
        }
    }

    /* absolute URL is ready! */
    return scheme + '://' + abs;
}

export function absolute2Relative(url) {
    if (!url) return null;

    const { path, query, fragment } = parse_url(url);
    let relativeUrl = path;

    query && (relativeUrl += '?' + query);
    fragment && (relativeUrl += '#' + fragment);

    return relativeUrl;
}

export function isAbsolute(url) {
    return !!parse_url(url, 'PHP_URL_SCHEME');
}

/**
 * Проверяет на равенство host и path двух URL
 */
export function arePathsEqual(url1, url2) {
    const absoluteUrl1 = relative2Absolute(url1, window.location.origin + '/');
    const parsedUrl1 = parse_url(absoluteUrl1);

    const absoluteUrl2 = relative2Absolute(url2, window.location.origin + '/');
    const parsedUrl2 = parse_url(absoluteUrl2);

    return parsedUrl1.host === parsedUrl2.host &&
        parsedUrl1.path === parsedUrl2.path;
}

export function getPath(url) {
    // parse_url не работает с относительными URL-ами, поэтому приводим к абсолютному
    if (!isAbsolute(url)) {
        url = relative2Absolute(url, window.location.origin + '/');
    }
    const parsedUrl = parse_url(url);
    return parsedUrl.path;
}

/**
 * Проверяет, содержится ли набор query-параметров params1 в params2
 */
export function queryContains(params1, params2) {
    const queryStr1 = typeof params1 === 'string' ? params1 : http_build_query(params1);
    const queryStr2 = typeof params2 === 'string' ? params2 : http_build_query(params2);

    const querySegments1 = decodeURIComponent(queryStr1).split('&');
    const querySegments2 = decodeURIComponent(queryStr2).split('&');

    return !arrayDiff(querySegments1, querySegments2).length;
}

/**
 * Удаление из полного URL части с хостом
 */
export function removeHost(url) {
    return url.replace(/^(?:https?\:)?\/\/[^\/]+/, '');
}

/**
 * Возвращает часть полного URL текущей страницы без хоста и протокола
 */
export function getFullCurrentPath() {
    const { pathname, search, hash } = window.location;
    return `${pathname}${search}${hash}`;
}
