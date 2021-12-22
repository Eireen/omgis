import $ from 'jquery';
import Cookies from 'js-cookie';

const isMobile = /midp|samsung|nokia|j2me|avant|docomo|novarra|palmos|palmsource|opwv|chtml|pda|mmp|blackberry|mib|symbian|wireless|nokia|hand|mobi|phone|cdm|upb|audio|SIE|SEC|samsung|HTC|mot-|mitsu|sagem|sony|alcatel|lg|eric|vx|NEC|philips|mmm|xx|panasonic|sharp|wap|sch|rover|pocket|benq|java|pt|pg|vox|amoi|bird|compal|kg|voda|sany|kdd|dbt|sendo|sgh|gradi|jb|dddi|moto|iphone|android/i.test(navigator.userAgent);

const isIOSSafari = (() => {
    const userAgent = window.navigator.userAgent;
    return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent) && !(/(CriOS|FxiOS|OPiOS|mercury)/i.test(userAgent));
})();

const isIOSWebView = (() => { // https://stackoverflow.com/a/9951404
    var standalone = window.navigator.standalone,
        userAgent = window.navigator.userAgent.toLowerCase(),
        isIOS = /iphone|ipod|ipad/.test(userAgent),
        isSafari = /safari/.test(userAgent);

    return isIOS && !standalone && !isSafari;
})();

const scrollbarWidth = calcScrollbarWidth();

function openInNewTab(url) {
    var win = window.open(url, '_blank');
    win.focus();
}

function calcScrollbarWidth() {
    var widthWithoutScrollbar, widthWithScrollbar,
        innerHTMLContainer = document.createElement('div');

    innerHTMLContainer.innerHTML = '<div style="display:block;width:50px;height:50px;overflow:hidden;"><div style="height:100px;width:auto;"></div></div>';

    var div = innerHTMLContainer.firstChild,
        innerDiv = div.firstChild;

    document.body.appendChild(innerHTMLContainer);
    widthWithoutScrollbar = innerDiv.offsetWidth;

    div.style.overflow = 'scroll';
    widthWithScrollbar = innerDiv.offsetWidth;

    if (widthWithoutScrollbar === widthWithScrollbar) {
        widthWithScrollbar = div.clientWidth;
    }

    document.body.removeChild(innerHTMLContainer);

    return widthWithoutScrollbar - widthWithScrollbar;
}

/* Для отключения скролла при отображении попапов */
/* https://stackoverflow.com/a/13891717 */
function disablePageScroll() {
    if (document.documentElement.classList.contains('noscroll')) return;

    if ($(document).height() > $(window).height()) {
        var scrollTop = $('html').scrollTop() || $('body').scrollTop(); // Works for Chrome, Firefox, IE...
        $('html').addClass('noscroll').css('top', -scrollTop);
    }
}
/* https://stackoverflow.com/a/13891717 */
function enablePageScroll() {
    if (!document.documentElement.classList.contains('noscroll')) return;

    var scrollTop = parseInt($('html').css('top'));
    $('html').removeClass('noscroll').css('top', '');
    $('html,body').scrollTop(-scrollTop);
}

function addIOSDeviceIdentifier(someData) {
    if (isIOSSafari) {
        const udid = Cookies.get('UDID');
        if (udid) {
            someData.UDID = udid;
        }
    }
    return someData;
}

/* КОСТЫЛЬ: удаляет или заменяет на `replaceTo` атрибут target="_blank" всем найденным в `containerElem` ссылкам
в случае, когда сайт открыт в приложении iOS через WebView */
function removeTargetBlankForLinks(containerElem, replaceTo = null) {
    if (!isIOSWebView || !containerElem) return;

    const links = containerElem.querySelectorAll('a[target="_blank"]');
    for (let link of links) {
        if (replaceTo) {
            link.target = replaceTo;
        } else {
            link.removeAttribute('target');
        }
    }
}

export { isMobile, isIOSSafari, isIOSWebView, openInNewTab, scrollbarWidth, disablePageScroll, enablePageScroll, addIOSDeviceIdentifier, removeTargetBlankForLinks };
