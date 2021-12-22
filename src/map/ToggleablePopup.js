/* Позволяет временно отключать привязанный попап без его удаления (что делает unbindPopup()).
Понадобилось для отключения показа попапа при выборе полигона для редактирования */

import L from 'leaflet';

L.Layer.include({

    _disabledPopup: null,

    disablePopup: function () {
        this._disabledPopup = this._popup;
        this.unbindPopup();
    },

    enablePopup: function () {
        this._disabledPopup &&
            this.bindPopup(this._disabledPopup);
        this._disabledPopup = null;
    }
});
