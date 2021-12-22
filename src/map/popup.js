import { bindHistoryCharts } from '../charts/historyChart';
import { initFlvJsPlayers } from './flvjsPlayer';
import { initVideoPlayers } from './videoPlayer';
import { isIOSSafari } from '../utils/browser';
import { improveWordWrap } from '../utils/dom';
import $ from 'jquery';
import api from '../api';
import NoPhoto from '../images/no_photo.png';
import MagnificPopup from '../vendor/jquery.magnific-popup.js'; // своя вариация с запоминанием ранее открытого попапа
import JQueryPeity from '../vendor/jquery.peity.js'; // плагин со своими добавлениями (см. /* EIREEN: ... */)

/* сюда сохраняем предыдущий HTML попапа, когда меняем его содержимое при отображении инфы о связанном объекте
(чтобы при нажатии кнопки "Назад" не загружать повторную загрузку предыдущего только что отображенного объекта) */
/* WARNING!!! Есть риск утечки памяти, т.к. не хватает очистки этого кэша по событию закрытия попапа layer.on('popupclose') */
let prevContentCache = {};

const $loadingMessage = $(
    '<div class="message">' +
        '<div class="text">Загрузка...</div>' +
        '<div class="close_button"></div>' +
    '</div>'
);

export function popupContentCallback(map, url, hasPhoto) {
    return function(layer) {
        const popup = this;

        loadContent(layer, popup, url, hasPhoto);

        // Кастомная кнопка закрытия
        $(popup.getElement()).on('click', '.close_button', () => {
            map.closePopup();
            prevContentCache = {};
        });

        return $loadingMessage[0];
    };
}

function loadContent(layer, popup, url, hasPhoto, addBackButton = false) {
    const loadPromise = prevContentCache[url]
        ? Promise.resolve(prevContentCache[url])
        : api.get(url);

    if (prevContentCache[url]) delete prevContentCache[url]; // удаляем использованный кэш

    loadPromise.then(content => {
        const $contentContainer = $(popup.getElement().querySelector('.leaflet-popup-content'));

        $contentContainer.html(content.html || content);
        if (addBackButton) {
            $contentContainer.append('<div class="medium_buttons_toolbar"><a href="javascript:void(0)" class="medium_button map_popup_back_button">Назад</a></div>');
            $contentContainer.find('.map_popup_back_button').click(event => {
                const urlsInCache = Object.keys(prevContentCache);
                loadContent(layer, popup, urlsInCache[urlsInCache.length - 1], hasPhoto);
            });
        }

        // Вставить в тексты таблицы <wbr> после подчёркиваний на случай очень длинных слов (например_такое_длинное_имя_документа)
        improveWordWrap($contentContainer[0].querySelectorAll('table.properties'));

        popup._updatePosition();

        // Загрузить фото
        const $photoContainer = $contentContainer.find('.photo');

        if (hasPhoto === false) {
            $photoContainer.remove();
        } else {
            const photos = content.photos || [];
            let firstPhoto = null;
            let photoUrl = NoPhoto;
            let photoUrl2x = null;
            let bigPhotoUrl = null;
            let bigPhotoUrl2x = null;
            if (photos && photos.length) {
                firstPhoto = photos[0];
                if (typeof firstPhoto === 'string') {
                    photoUrl = firstPhoto;
                } else {
                    if (firstPhoto['1x']) {
                        photoUrl = firstPhoto['1x'];
                    }
                    if (firstPhoto['2x']) {
                        photoUrl2x = firstPhoto['2x'];
                    }
                    if (firstPhoto['big']) {
                        bigPhotoUrl = firstPhoto['big'];
                    }
                    if (firstPhoto['big2x']) {
                        bigPhotoUrl2x = firstPhoto['big2x'];
                    }
                }
            }

            const imageSrc = isIOSSafari && photoUrl2x
                ? photoUrl2x
                : photoUrl;
            const bigImageSrc = isIOSSafari && bigPhotoUrl2x
                ? bigPhotoUrl2x
                : bigPhotoUrl;

            // Для отображения сообщения об ошибке загрузки изображения придется грузить его через Image()
            let image = new Image();
            const onLoad = function() {
                $photoContainer
                    .find('._photo')
                    .css({ backgroundImage: `url(${imageSrc})` });

                image.removeEventListener('load', onLoad);
                image.removeEventListener('error', onError);
                image.src = '';
                image = null;

                if (imageSrc === NoPhoto) {
                    $photoContainer.removeClass('zoomable');
                } else {
                    $photoContainer
                        .addClass('zoomable')
                        .attr('data-mfp-src', bigPhotoUrl || imageSrc)
                        .magnificPopup({
                            type: 'image',
                            items: photos.map(photo => ({ src: photo[ isIOSSafari && photo.big2x ? 'big2x' : 'big' ] })),
                            gallery: {
                                enabled: photos.length > 1,
                                preload: 0,
                                tPrev: 'Предыдущее изображение',
                                tNext: 'Следующее изображение',
                                tCounter: '<span class="mfp-counter">%curr% / %total%</span>'
                            },
                            closeOnContentClick: true,
                            closeBtnInside: false,
                            mainClass: 'mfp-no-margins mfp-kim-photo-wrap', // mfp-no-margins is for removing default margin from left and right side
                            image: {
                                verticalFit: true,
                                tError: 'Не удалось загрузить изображение.'
                            },
                            tLoading: 'Загрузка...',
                            tClose: 'Закрыть'
                        });
                }
            };
            const onError = function() {
                $photoContainer.html('<div class="error">Не удалось загрузить фото</div>');
            }
            image.addEventListener('load', onLoad);
            image.addEventListener('error', onError);
            image.src = imageSrc;

            if (photos.length) {
                $photoContainer
                    .find('.object_gallery_count')
                        .removeClass('hidden')
                        .find('.number')
                            .html(photos.length);
            } else {
                $photoContainer
                    .find('.object_gallery_count')
                        .addClass('hidden');
            }
        }

        if (layer) {
            //initFlvJsPlayers(layer);
            initVideoPlayers(layer);
        }
        initVideoLinks($contentContainer);
        initMiniCharts($contentContainer);
        initPopupContentLinks(layer, popup, url, hasPhoto, $contentContainer);

        // Попап с камерой может вылезать за пределы экрана - используем autopanning
        /* TODO: не работает сейчас - autopanning, видимо, не знает о правилах расположения
        кастомного попапа SidePopup и всё время сдвигает карту влево */
        /*if ($contentContainer.find('img.video').length) {
            Leaflet.Util.setOptions(popup, { autoPan: true });
            popup._adjustPan();
            Leaflet.Util.setOptions(popup, { autoPan: false });
        }*/

        // Подгонка ширины попапа под контент (растягивает при необходимости)
        popup.adjustWidthByContent && popup.adjustWidthByContent();

        bindHistoryCharts($contentContainer[0]);
    }).catch(error => {
        $loadingMessage.replaceWith(
            '<div class="message">' +
                '<div class="text">Ошибка</div>' +
                '<div class="close_button"></div>' +
            '</div>'
        );
        console.log(error);
    });
}

function initVideoLinks($popupContent) {
    $popupContent.find('[data-video-link]').each(function() { initVideoLink(this) });
}

function initVideoLink(linkNode) {
    const $videoLink = $(linkNode);
    const src = $videoLink.attr('href');
    let videoHeight = window.innerHeight - document.querySelector('.page_container .page_header').offsetHeight - 30;
    if (isIOSSafari) {
        videoHeight = Math.min(videoHeight, 480);
    }

    if (/\.mp4$/.test(src)) {
        // Standalone video file
        $videoLink.magnificPopup({
            items: {
                src: isIOSSafari
                    ? `<video src="${src.replace(/\.mp4$/, '_ios.mp4')}" poster=${src.replace(/\.mp4$/, '_poster.jpg')} controls height="${videoHeight}"></video>`
                    : `<video src="${src}" poster=${src.replace(/\.mp4$/, '_poster.jpg')} preload="auto" controls height="${videoHeight}px">
                        <source src="${src}" type="video/mp4">
                    </video>`,
                type: 'inline'
            },
            closeBtnInside: false,
            mainClass: 'mfp-history-chart', // mfp-no-margins is for removing default margin from left and right side
            image: {
                verticalFit: true,
                tError: 'Не удалось загрузить видео.'
            },
            tLoading: 'Загрузка...',
            tClose: 'Закрыть',
            callbacks: {
                open: function() {
                    // Thanks to: https://github.com/dimsemenov/Magnific-Popup/issues/626#issuecomment-90713851

                    // https://github.com/dimsemenov/Magnific-Popup/issues/125
                    //$('html').css('margin-right', 0);
                }
            }
        });
    } else {
        // M-JPEG
        $videoLink.magnificPopup({
            type: 'image',
            closeOnContentClick: true,
            closeBtnInside: false,
            mainClass: 'mfp-no-margins mfp-kim-photo-wrap', // mfp-no-margins is for removing default margin from left and right side
            image: {
                verticalFit: true,
                tError: 'Не удалось загрузить изображение.'
            },
            tLoading: 'Загрузка...',
            tClose: 'Закрыть',
            callbacks: {
                open: function() {
                    const img = this.content.find('img');
                    img.css('height', img.css('max-height'));
                }
            }
        });
    }
}

function initMiniCharts($popupContent) {
    $popupContent.find('[data-peity-chart]').each(function() {
        const chartOptions = JSON.parse(this.dataset.peityChart);
        $(this).peity(chartOptions.type, chartOptions);
    });
}

function initPopupContentLinks(layer, popup, url, hasPhoto, $popupContent) {
    $popupContent.find('a[data-popup-content-link]').click(function(event) {
        event.preventDefault();

        prevContentCache[url] = $popupContent.html();

        $popupContent.empty().append($loadingMessage);

        loadContent(layer, popup, this.getAttribute('data-popup-content-link'), hasPhoto, true);

        return false;
    });
}
