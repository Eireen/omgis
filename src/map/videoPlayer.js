import { createVideoPlayer, destroyVideoPlayer } from '../utils/video';

export function initVideoPlayers(layer) {
    if (!layer.getPopup()) return;

    layer.videoPlayers = []; // remember for further destroying on close

    const popupElement = layer.getPopup().getElement();
    const videoElements = popupElement.querySelectorAll('video.video-js');
    for (let videoElement of videoElements) {
        const player = createVideoPlayer(videoElement);
        layer.videoPlayers.push(player);

        /* Set width & height */

        const playerRootElement = videoElement.closest('.video.video-js');

        const originalWidth = +videoElement.dataset.originalWidth || 1280;
        const originalHeight = +videoElement.dataset.originalHeight || 720;

        const adaptedVideoWidth = window.innerWidth <= 1024 ? 400 : 640; // map popup width
        const adaptedVideoHeight = adaptedVideoWidth * originalHeight / originalWidth;

        playerRootElement.style.width = `${Math.round(adaptedVideoWidth)}px`;
        playerRootElement.style.height = `${Math.round(adaptedVideoHeight)}px`;
    }
}

export function cleanUpVideoPlayers(layer) {
    if (!layer.videoPlayers) return;

    layer.videoPlayers.forEach(destroyVideoPlayer);
    delete layer.videoPlayers;
}
