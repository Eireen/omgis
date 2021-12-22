/* Возможность задания пиксельного смещения для маркеров через угол и расстояние */

import L from 'leaflet';

L.MarkerOffset = {

    offset: function(point, angle, distance) {
        return this._getSegmentEndPointByAngle(point, angle, distance);
    },

    _getSegmentEndPointByAngle(startPoint, angle, distance) {
        // Thanks to: https://stackoverflow.com/a/1638461/1780443
        return L.point({
            x: startPoint.x + distance * Math.cos(angle),
            y: startPoint.y + distance * Math.sin(angle)
        });
    }
}

L.CircleMarker.include({

    _project: function () {
        this._point = this._map.latLngToLayerPoint(this._latlng);

        if (this.options.offset) {
            const { angle, distance } = this.options.offset;
            this._point = L.MarkerOffset.offset(this._point, angle, distance);
        }

        this._updateBounds();
    }
});
