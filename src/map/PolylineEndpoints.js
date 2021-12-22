/* Отрисовка маркеров на концах линии */

import L from 'leaflet';

const pluginOptionsFieldName = 'endpoints';

L.PolylineEndpoints = L.FeatureGroup.extend({

    options: {
        style: null,
        minZoom: null,
    },

    _mapPermalink: null,  // '_map' используется родительскими слоями и затирается когда не нужно
    _polyline: null,
    _style: null,
    _boundZoomHandler: null,

    initialize: function(polyline, map, options = {}) {
        L.FeatureGroup.prototype.initialize.call(this, []);

        this._polyline = polyline;
        this._mapPermalink = map;
        this.options = options;

        this._calcStyle();
        this._drawEndpoints();
        this._addToMap();
    },

    _calcStyle: function() {
        this._style = Object.assign({}, this.options.style || {});

        const polylineStyle = this._polyline.options;
        const inheritableStyles = { color: 'color', fillColor: 'color' }; // pointStyleProp: lineStyleProp
        for (let pointStyleProp in inheritableStyles) {
            const lineStyleProp = inheritableStyles[pointStyleProp];
            if (this._style[pointStyleProp] === undefined && polylineStyle[lineStyleProp]) {
                this._style[pointStyleProp] = polylineStyle[lineStyleProp];
            }
        }
    },

    _drawEndpoints: function() {

        for (let endpoint of this._getEndpoints()) {
            if (!endpoint) continue;

            this._drawEndpoint(endpoint);
        }
    },

    _drawEndpoint: function (endpoint) {
        const markerOptions = Object.assign({}, this._style, {
            pane: 'polylineEndpointsPane',
        });
        L.circleMarker(endpoint, markerOptions).addTo(this);
    },

    _getEndpoints: function() {
        const result = [];

        const latlngs = this._polyline._latlngs;

        if (!latlngs) return result;

        const isMultiPolyline = Array.isArray(latlngs[0]);

        const multiPolyline = isMultiPolyline ? latlngs : [ latlngs ];

        for (let subPolyline of multiPolyline) {
            const firstPoint = subPolyline[0] || null;
            const lastPoint = subPolyline[subPolyline.length - 1] || null;
            if (firstPoint) result.push(firstPoint);
            if (lastPoint) result.push(lastPoint);
        }

        return result;
    },

    _addToMap: function() {
        this._setupZoomHandler();
        this._updateVisibility();
    },

    _setupZoomHandler: function() {
        const { minZoom } = this.options;

        if (!minZoom) return;

        this._boundZoomHandler = this._zoomHandler.bind(this);

        this._mapPermalink.on('zoomend', this._boundZoomHandler);
    },

    _zoomHandler: function() {
        this._updateVisibility();
    },

    _updateVisibility: function() {
        const map = this._mapPermalink;
        if (!map) return;

        const { minZoom } = this.options;

        if (!minZoom || map.getZoom() >= minZoom) {
            if (!map.hasLayer(this)) {
                this.addTo(map);
            }
        } else {
            this.remove();
        }
    },

    _offHandlers: function() {
        const map = this._mapPermalink;
        if (!map) return;

        if (this._boundZoomHandler) map.off('zoomend', this._boundZoomHandler);
    },
});

L.Polyline.include({

    _parent_onAdd: L.Polyline.prototype.onAdd,
    _parent_onRemove: L.Polyline.prototype.onRemove,

    onAdd: function(map) {
        this._parent_onAdd(map);

        if (this.options && this.options[pluginOptionsFieldName]) {
            this._endpointsLayer = new L.PolylineEndpoints(this, map, this.options[pluginOptionsFieldName]);
        }
    },

    onRemove: function(map) {
        if (this._endpointsLayer) {
            this._endpointsLayer.remove();
            this._endpointsLayer._offHandlers();
            this._endpointsLayer = null;
        }

        this._parent_onRemove(map);
    },
});
