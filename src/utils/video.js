import { isIOSSafari } from './browser';
import MagnificPopup from '../vendor/jquery.magnific-popup.js'; // своя вариация с запоминанием ранее открытого попапа
import videojs from 'video.js';
// Пакет videojs-contrib-hls.js добавлен, т.к. встроенный в video.js @videojs/http-streaming сыпал ошибки после первого же кадра и вообще переставал работать
import VideoJsHlsPackage from 'videojs-contrib-hls.js';

export function createVideoPlayer(domElement, customPlayerSettings = {}) {
    const player = videojs(domElement,
        Object.assign({
            autoplay: true,
            fill: true,
            html5: {
                hlsjsConfig: {
                }
            }
        },
        customPlayerSettings
    ));
    return player;
}

export function destroyVideoPlayer(player) {
    if (!player) return;
    player.dispose();
}

export function showVideoInPopup({ type, src, name }) {
    let videoHeight = window.innerHeight - document.querySelector('.page_container .page_header').offsetHeight - 30;
    if (isIOSSafari) {
        videoHeight = Math.min(videoHeight, 480);
    }

    if (/\.mp4$/.test(src)) {
        // Standalone video file
        $.magnificPopup.open({
            items: {
                src: isIOSSafari
                    ? `<video src="${src.replace(/\.mp4$/, '_ios.mp4')}" poster="${src.replace(/\.mp4$/, '_poster.jpg')}" controls height="${videoHeight}"></video>`
                    : `<video src="${src}" poster="${src.replace(/\.mp4$/, '_poster.jpg')}" preload="auto" controls height="${videoHeight}px">
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
    } else if (~['hls'].indexOf(type)) {
        // HLS
        const playerFieldName = Symbol('playerFieldName'); // save reference to the player for further destroying

        /* NOTE: src в этом случае не URL, а HTML вида:
            <video width="720" height="405" class="video video-js vjs-default-skin" preload="metadata" controls>
                <source src="http://212.59.99.125:8000/hls/stream/index.m3u8" type="application/x-mpegURL">
            </video>
        */

        const embedHtml = `<div class="video_popup">${src}</div>`;

        $.magnificPopup.open({
            items: [{
                src: embedHtml,
                type: 'inline',
            }],
            closeBtnInside: false,
            mainClass: 'mfp-no-margins mfp-kim-photo-wrap', // mfp-no-margins is for removing default margin from left and right side
            tLoading: 'Загрузка...',
            tClose: 'Закрыть',
            callbacks: {
                open: function() {
                    const videoElement = this.content[0].querySelector('video.video-js');
                    const player = createVideoPlayer(videoElement);
                    this.items[0][playerFieldName] = player; // save reference to the player for further destroying

                    /* Set width & height */

                    const playerRootElement = this.content[0].querySelector('.video.video-js');

                    const originalWidth = +videoElement.dataset.originalWidth || 1280;
                    const originalHeight = +videoElement.dataset.originalHeight || 720;

                    const MIN_Y_MARGIN = 50; // мин. отступ попапа от границ окна
                    const adaptedVideoHeight = Math.min(
                        originalHeight,
                        window.innerHeight - MIN_Y_MARGIN * 2
                    );
                    const adaptedVideoWidth = adaptedVideoHeight * originalWidth / originalHeight;

                    playerRootElement.style.width = `${Math.round(adaptedVideoWidth)}px`;
                    playerRootElement.style.height = `${Math.round(adaptedVideoHeight)}px`;
                    playerRootElement.closest('.mfp-content').style.width = `${Math.round(adaptedVideoWidth)}px`;
                },
                beforeClose: function() {
                    const player = this.items[0][playerFieldName];
                    if (player) destroyVideoPlayer(player);
                    delete this.items[0][playerFieldName];
                },
            }
        });
    } else {
        // M-JPEG by default
        $.magnificPopup.open({
            type: 'image',
            items: [{ src }],
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
