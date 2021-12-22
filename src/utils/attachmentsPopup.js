import $ from 'jquery';
import { escapeHtmlByEntities } from './html';
import { removeTargetBlankForLinks } from './browser';
import { trackDynamicContent } from './analytics';

// Типы файлов, для которых есть SVG-иконки
var iconizedFileTypes = ['doc', 'docx', 'dwg', 'gif', 'jpg', 'ods', 'odt', 'pdf', 'png', 'ppt', 'rar', 'rtf', 'tgz', 'tiff', 'txt',
    'xls', 'xlsx', 'zip'];

createAttachmentsPopup();

var openToggleElement;

function createAttachmentsPopup() {
    if (!document.querySelector('.attachments_popup')) {
        document.querySelector('.page_container').insertAdjacentHTML('afterEnd',
            `<div class="attachments_popup">
                <div class="close">
                    <i class="icn icn_cross"></i>
                </div>
                <div class="content"></div>
            </div>`
        );

        $('body').on('click', '.attachments_popup .close', function() {
            toggleAttachmentsPopup();
        });
    }
}

/* Обработчик клика по кнопке отображения прикрепленных файлов */
export function handleAttachmentsTrigger(attachments, toggleElement, popupOffsets) {
    if (!isAttachmentPopupOpenOn(toggleElement)) {
        var basenames = attachments.map(function(attachment) {
                var url = attachment.url !== undefined ? attachment.url : attachment,
                    chunks = url.split('/');
                if (!url) return '';
                return decodeURIComponent(chunks[chunks.length - 1]);
            }),
            filenames = basenames.map(function(basename) {
                return basename.substr(0, basename.lastIndexOf('.'));
            }),
            extensions = basenames.map(function(basename) {
                return basename.substr(basename.lastIndexOf('.') + 1);
            }),
            html = '', filename, ext, icon, iconHtml, filenameHtml, cssClasses, classesHtml, docUrl, i, l;

        for (var i = 0, l = attachments.length; i < l; i++) {
            if (!filenames[i]) continue;
            cssClasses = [];
            ext = extensions[i].toLowerCase();
            if (attachments[i].color) {
                cssClasses.push('highlighted');
                cssClasses.push(attachments[i].color);
            }
            if (attachments[i].inactive) {
                cssClasses.push('inactive');
            }
            if (attachments[i].icon) {
                icon = attachments[i].icon;
                iconHtml = '<img src="' + icon + '" class="file_type_icon" width="34">';
            }
            else {
                switch (ext) {
                    case 'pptx':
                        icon = 'ppt';
                        break;
                    case 'gz':
                        icon = 'tgz';
                        break;
                    case 'jpeg':
                        icon = 'jpg';
                        break;
                    case 'tif':
                        icon = 'tiff';
                        break;
                    default:
                        if (~iconizedFileTypes.indexOf(ext)) {
                            icon = ext;
                        } else {
                            icon = 'default';
                        }
                }
                iconHtml = '<svg class="file_type_icon ' + icon + '" width="34px" height="34px"><use xlink:href="#icn_file_' + icon + '"></use></svg>';
            }
            docUrl = attachments[i].url || attachments[i];
            classesHtml = cssClasses.length ? ' class="' + cssClasses.join(' ') + '"' : '';
            filenameHtml = '<span class="dont_break_out">' + filenames[i] + '</span>';
            html +=
                '<a href="' + escapeHtmlByEntities(docUrl) + '"' + classesHtml + ' target="_blank">' +
                    iconHtml +
                    filenameHtml +
                '</a>';
        }

        const $contentContainer = $('.attachments_popup .content');
        $contentContainer.html(html);

        trackDynamicContent($contentContainer[0]);

        removeTargetBlankForLinks($contentContainer[0], '_self'); // костыль для IOS WebView
    }

    toggleAttachmentsPopup(toggleElement, popupOffsets);
}

/* NOTE: toggleElement может быть обычным DOM-элементом либо обёрткой над SVG-элементом из библиотеки Snap.svg */
function toggleAttachmentsPopup(toggleElement, popupOffsets) {
    var $popup = $('.attachments_popup');

    if ($popup.is(':visible')) {
        $popup.hide();
    }

    if (toggleElement && openToggleElement && toggleElement !== openToggleElement) {
        attachmentPopupFlagOff(openToggleElement);
    }

    const close = !toggleElement || isAttachmentPopupOpenOn(toggleElement);

    if (!toggleElement) {
        toggleElement = openToggleElement;
    }

    if (toggleElement) {
        attachmentPopupFlagOff(toggleElement);
    }

    if (close) {
        $('body').off('click', hideAttachmentsPopupOnBodyClick);
        openToggleElement = null;
        return;
    }

    openToggleElement = toggleElement; // сохраняем в буфер, чтобы потом не искать по DOM или SVG

    /* Сбрасываем top/left - иначе результирующая ширина окна может вычисляться неправильно */
    $popup.css({
        display : 'inline-block',
        top     : 0,
        left    : 0
    });

    var fullPageHeight = document.body.scrollHeight,
        buttonPos = getToggleElementPos(toggleElement),
        buttonSize = getToggleElementSize(toggleElement),
        viewport  = {
            l : document.body.scrollLeft,
            t : $(document).scrollTop(),
            w : document.documentElement.clientWidth,
            h : document.documentElement.clientHeight
        },
        top = buttonPos.top,
        left = buttonPos.left,
        leftMargin = 10, // отступ от кнопки при расположении сбоку
        topMargin = 3, // отступ от кнопки при расположении снизу
        bottomMargin = 40, // отступ от нижнего края страницы
        popupStyle = getComputedStyle($popup[0]),
        popupWidth = $popup.actual('width'),
        popupHeight = $popup.actual('height') + parseFloat(popupStyle.paddingTop) + parseFloat(popupStyle.paddingBottom),
        iconCount = $popup.find('img.file_type_icon').length,
        iconHeightCorrection = 18; // иконки-изображения не прогружены на момент вычисления высоты попапа; добавить поправку

    popupHeight += iconCount * iconHeightCorrection; // TODO точный расчет высоты с загруженными иконками

    if (window.innerWidth <= 950) {
        top += buttonSize.height + topMargin;
    } else {
        left -= popupWidth + leftMargin;
    }

    // Если вылазит за нижний край страницы, поднять вверх
    if (top + popupHeight > fullPageHeight - bottomMargin) {
        top = fullPageHeight - popupHeight - bottomMargin;
    }

    if (left + popupWidth > viewport.l + viewport.w) {
        left = buttonPos.left - popupWidth;
    }
    if (left < viewport.l) {
        left = buttonPos.left + buttonSize.width;
    }

    if (window.innerWidth > 950 && left > viewport.w - popupWidth - 3) {
        left = viewport.w - popupWidth - 3;
    }
    if (top > $('.page_container').height() - popupHeight - 10) {
        top = $('.page_container').height() - popupHeight - 10;
    }

    /* popupOffsets - это возможность задать кастомные смещения попапа с файлами при его отображении (top, left).
    Например, когда мы отображаем попап из SVG-диаграммы, нужно доп. смещение ближе к кнопке */
    if (popupOffsets) {
        if (popupOffsets.top) {
            top += popupOffsets.top;
        }
        if (popupOffsets.left) {
            left += popupOffsets.left;
        }
    }

    $popup.css({
        top     : top + 'px',
        left    : left + 'px'
    });

    $('body').on('click', hideAttachmentsPopupOnBodyClick);

    attachmentPopupFlagOn(toggleElement);
}

function hideAttachmentsPopupOnBodyClick(evt) {
    let excludedElems = $('.attachments_popup, .attachments, .attachment_view_popup').toArray();
    if (openToggleElement) {
        excludedElems = excludedElems.concat([ openToggleElement ]);
    }
    onOutsideClick(excludedElems, function() {
        toggleAttachmentsPopup();
    }, evt);
}

/* Выполнить someFunction при клике в любом месте страницы, кроме excludedElems (например, для закрытия попапов) */
function onOutsideClick(excludedElems, someFunction, clickEvent) {
    for (var i = 0, l = excludedElems.length; i < l; i++) {
        if (isSvgElement(excludedElems[i]) && clickEvent.target === excludedElems[i].node ||
            (clickEvent.target === excludedElems[i] || $.contains(excludedElems[i], clickEvent.target)))
        {
            return;
        }
    }

    someFunction();
}

/* NOTE: toggleElement может быть обычным DOM-элементом либо обёрткой над SVG-элементом из библиотеки Snap.svg.
В случае обёртки у неё есть поле `node`, куда вложен стандартный SVG-элемент */
function isSvgElement(element) {
    return !!(element instanceof SVGElement ||
        element.node && element.node instanceof SVGElement);
}

/* NOTE: toggleElement может быть обычным DOM-элементом либо обёрткой над SVG-элементом из библиотеки Snap.svg */
function isAttachmentPopupOpenOn(toggleElement) {
    return isSvgElement(toggleElement)
        ? !!toggleElement.data('popupOpened')
        : !!$(toggleElement).attr('data-popup-opened');
}

function attachmentPopupFlagOn(toggleElement) {
    isSvgElement(toggleElement)
        ? toggleElement.data('popupOpened', true)
        : $(toggleElement).attr('data-popup-opened', true);
}

function attachmentPopupFlagOff(toggleElement) {
    isSvgElement(toggleElement)
        ? toggleElement.removeData('popupOpened')
        : $(toggleElement).attr('data-popup-opened', '');
}

function getToggleElementPos(toggleElement) {
    let result;

    if (isSvgElement(toggleElement)) {
        const metrics = toggleElement.node.getBoundingClientRect();
        result = {
            top: metrics.top + $(document).scrollTop(),
            left: metrics.left + $(document).scrollLeft(),
        };
    } else {
        const pos = $(toggleElement).offset();
        result = {
            top: pos.top,
            left: pos.left
        };
    }

    return result;
}

function getToggleElementSize(toggleElement) {
    let result;

    if (isSvgElement(toggleElement)) {
        const metrics = toggleElement.getBBox();
        result = {
            width: metrics.width,
            height: metrics.height,
        }
    } else {
        result = {
            width: toggleElement.offsetWidth,
            height: toggleElement.offsetHeight,
        };
    }

    return result;
}
