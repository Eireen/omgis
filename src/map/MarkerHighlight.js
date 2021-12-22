/* Модифицированная версия https://github.com/brandonxiang/leaflet.marker.highlight */

import L from 'leaflet';

const parent__setPos = L.Marker.prototype._setPos;

L.Marker.include({

    _pos: null, // сюда сохраняем позицию, полученную при создании маркера (DomUtil.getPosition(this) не помогает)

    _createHighlightIcon: function(radius = 20) {
        var highlight = this._highlight = L.DivIcon.prototype.createIcon();
        L.DomUtil.addClass(highlight, 'kim-marker-icon highlight');
        var border = L.DomUtil.create('div', 'border', highlight);
        border.style.width = `${radius * 2}px`;
        border.style.height = `${radius * 2}px`;
        this.getPane().appendChild(highlight);
        this.on('remove', function() {
            highlight.remove();
        });
    },

    _setPos: function(pos) {
        parent__setPos.apply(this, arguments);

        this._highlight &&
            L.DomUtil.setPosition(this._highlight, pos);

        this._pos = pos;
    },

    addHighlight: function(radius) {
        if (this._highlight) return;

        this._createHighlightIcon(radius);
        this._pos !== null &&
            L.DomUtil.setPosition(this._highlight, this._pos);
    },

    removeHighlight: function(value) {
        if (!this._highlight) return;

        this._highlight.remove();
        this._highlight = null;
    }
});
