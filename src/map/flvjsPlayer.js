import FlvJs from 'flv.js/dist/flv.js';

FlvJs.LoggingControl.applyConfig(
    Object.assign(FlvJs.LoggingControl.getConfig(), {
        enableAll: false,
        enableDebug: false,
        enableVerbose: false,
        enableInfo: false,
        enableWarn: true,
        enableError: true
    })
);

export function initFlvJsPlayers(layer) {
    if (!FlvJs.isSupported() || !layer.getPopup()) return;

    layer.flvJsPlayers = []; // remember for further destroying on close

    const popupElement = layer.getPopup().getElement();
    const flvVideos = popupElement.querySelectorAll('video[data-flv-js]');
    for (let videoElement of flvVideos) {
        const flvPlayer = FlvJs.createPlayer({
            type: 'flv',
            isLive: true,
            url: videoElement.dataset.src
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvPlayer.play();
        layer.flvJsPlayers.push(flvPlayer);
    }
}

export function cleanUpFlvJsPlayers(layer) {
    if (!layer.flvJsPlayers) return;

    layer.flvJsPlayers.forEach(destroyFlvJsPlayer);
    delete layer.flvJsPlayers;
}

function destroyFlvJsPlayer(player) {
    player.pause();
    player.unload();
    player.detachMediaElement();
    player.destroy();
    player = null;
}
