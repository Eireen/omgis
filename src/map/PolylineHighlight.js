/* Подсветка линии цветным фоном позади.
    - при наведении мыши;
    - постоянная
*/

import L from 'leaflet';

const pluginOptionsFieldName = 'kim_highlight';
const STATIC_BACK_LAYER_FIELD = '_kim_staticBackLayer';
const HOVER_BACK_LAYER_FIELD = '_kim_hoverBackLayer';

const _parent_onAdd = L.FeatureGroup.prototype.onAdd;
const _parent_onRemove = L.FeatureGroup.prototype.onRemove;

L.FeatureGroup.include({

    _hoverHandlers: null,

    onAdd: function(map) {
        _parent_onAdd.call(this, map);

        if (!this.options || !this.options[pluginOptionsFieldName]) return;

        const pluginOptions = this.options[pluginOptionsFieldName];

        if (pluginOptions.static) { // Статическая подсветка
            this._createStaticBackLayers(pluginOptions.static);
            this._showStaticHighlights(map);
        }

        if (pluginOptions.hover) { // Подсветка по наведению
            this._createHoverBackLayers(pluginOptions.hover);
            this._registerHoverHandlers(map);
        }
    },

    onRemove: function(map) {
        this.getLayers().forEach(layer => {
            for (let highlightType of [STATIC_BACK_LAYER_FIELD, HOVER_BACK_LAYER_FIELD]) {
                if (layer[highlightType]) {
                    layer[highlightType].remove();
                    delete layer[highlightType];
                }
            }
        });

        if (this.options && this.options[pluginOptionsFieldName]) {
            this._unregisterHoverHandlers();
        }

        _parent_onRemove.call(this, map);
    },

    _createStaticBackLayers: function(options) {
        this._createBackLayers(options, STATIC_BACK_LAYER_FIELD);
    },

    _createHoverBackLayers: function(options) {
        this._createBackLayers(options, HOVER_BACK_LAYER_FIELD);
    },

    _createBackLayers: function(options, fieldName) {
        for (let polylineLayer of this.getLayers()) {
            this._createBackLayer(polylineLayer, options, fieldName);
        }
    },

    _createBackLayer: function(polylineLayer, options, fieldName) {
        /* TODO: не-линии пока обходим. В частности, в слое "Судовые ходы" может встретиться тип 'GeometryCollection'
        (один Point и два LineString) - shw_id = 277, LOAD_water_way_RF.id = 8149
        (пока добавлена конвертация в мультилинию для всех объектов на сервере) */
        if (!~['LineString', 'MultiLineString'].indexOf(polylineLayer.feature.geometry.type)) return;

        polylineLayer[fieldName] = L.polyline(polylineLayer.getLatLngs(), options.style);
    },

    _showStaticHighlights: function(map) {
        for (let polylineLayer of this.getLayers()) {
            this._showHighlight(polylineLayer, STATIC_BACK_LAYER_FIELD, map);
        }
    },

    _registerHoverHandlers: function(map) {
        const groupLayer = this;

        this._hoverHandlers = {
            mouseover: function(event) {
                groupLayer._showHighlight(event.layer, HOVER_BACK_LAYER_FIELD, map);
                this._decreaseGroupBrightness(event.layer);
            },
            mouseout: function(event) {
                groupLayer._hideHighlight(event.layer, HOVER_BACK_LAYER_FIELD, map);
                this._restoreGroupBrightness();
            }
        }

        this.on(this._hoverHandlers);
    },

    _unregisterHoverHandlers: function() {
        if (!this._hoverHandlers) return;

        this.off(this._hoverHandlers);
    },

    _showHighlight: function(polylineLayer, highlightType, map) {
        const backLayer = polylineLayer[highlightType];

        if (backLayer && !map.hasLayer(backLayer)) {
            /* Рисуем подложку поверх линии, затем переносим наверх линию - чтобы
            получились красивые чистые белые границы без пересечений с другими линиями */
            backLayer.addTo(map);
            polylineLayer.bringToFront();
        }
    },

    _hideHighlight: function(polylineLayer, highlightLayerField, map) {
        polylineLayer[highlightLayerField] && polylineLayer[highlightLayerField].remove();
    },

    _decreaseGroupBrightness: function(exceptPolylineLayer) {
        const pluginOptions = this.options[pluginOptionsFieldName];

        const opacity =
            pluginOptions.othersStyle &&
            pluginOptions.othersStyle.opacity;

        if (opacity === undefined) return;

        this._setGroupStyle({ opacity, fillOpacity: opacity }, exceptPolylineLayer);
    },

    _restoreGroupBrightness: function() {
        this._setGroupStyle({ opacity: 1, fillOpacity: 1 }, null, true);
    },

    _setGroupStyle: function(style, exceptFeatureLayer = null, isStyleRestoring = false) {
        // isStyleRestoring - костыль для распознавания этапа восстановления яркости приглушенных линий (снятие ховера)

        const layers = this.getLayers();
        const mapBounds = this._map.getBounds();
        const affectedFlag = '_polylineHover_brightnessAffected';

        for (let i = 0, l = layers.length; i < l; i++) {
            const featureLayer = layers[i];

            if (isStyleRestoring) {
                if (!featureLayer[affectedFlag]) continue;
            } else {
                if (featureLayer === exceptFeatureLayer || !mapBounds.overlaps(featureLayer.getBounds())) {
                    continue;
                }
            }

            if (isStyleRestoring) {
                this.resetStyle(featureLayer);
            } else {
                featureLayer.setStyle(style);
            }

            // КОСТЫЛЬ: помечаем слои, которые были "приглушены" при ховере, для правильного и быстрого восстановления стилей
            if (isStyleRestoring) {
                delete featureLayer[affectedFlag];
            } else {
                featureLayer[affectedFlag] = true;
            }

            // КОСТЫЛЬ: забледнить также граничные точки, рендерящиеся плагином PolylineEndpoints
            if (featureLayer._endpointsLayer) {
                featureLayer._endpointsLayer.setStyle(style);
            }
        }
    },
});
