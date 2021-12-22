import $ from 'jquery';

/* Заменяет теги пробелами */
export function strip_tags_space(str) {
    return str.replace(/<[^>]+>/g, ' ');
}

export function removeBrTag(str) {
    return str.replace(/<br[^>]*>/g, ' ');
}

export function html_entity_decode(string) {
    return $('<textarea />').html(string).text();
}

export function htmlEncode(html) {
    return document.createElement('a')
        .appendChild(document.createTextNode(html))
        .parentNode.innerHTML;
};

export function escapeHtmlByEntities(str) {
    return (str + '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
