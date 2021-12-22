/* Позволяет временно отключать привязанный тултип без его удаления (что делает unbindTooltip()).
Понадобилось для отключения тултипа при отображении попапа */

import L from 'leaflet';

L.Layer.include({

    _disabledTooltip: null,

    disableTooltip: function () {
        this._disabledTooltip = this._tooltip;
        this.unbindTooltip();
    },

    enableTooltip: function () {
        this._disabledTooltip &&
            this.bindTooltip(this._disabledTooltip);
        this._disabledTooltip = null;
    }
});
