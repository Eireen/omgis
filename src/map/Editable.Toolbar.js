/**
 * Тулбар редактирования для плагина Leaflet.Editable
 */

import L from 'leaflet';
import LatLngUtil from './LatLngUtil';

L.EditableToolbar = L.Control.extend({

    options: {
        position: 'topright'
    },

    layers: [], // слои, отображающиеся на карте в данный момент и доступные для редактирования (нетайловые)

    _map: null,

    _enabled: false, // доступна ли кнопка включения режима редактирования
    _editModeOn: false,

    _currentEditingObject: null, // объект типа "полигон" или "линия", выбранный для редактирования (точки в предварит. выборе не нуждаются)

    _layerBackup: {}, // бэкап данных для возможности отката изменений

    _actionsActiveClass: 'visible',
    _disabledButtonClass: 'leaflet-disabled',

    initialize: function (options = {}) {
        L.extend(this.options, options);
    },

    onAdd: function (map) {
        this._map = map;

        var toolbarsContainer = L.DomUtil.create('div', 'leaflet-edit leaflet-control'),
            toolbarContainer = L.DomUtil.create('div', 'leaflet-edit-section', toolbarsContainer),
            toolbar = L.DomUtil.create('div', 'leaflet-bar leaflet-edit-toolbar', toolbarContainer);

        this._editButton = this._createEditButton(toolbar);

        this._actionsContainer = L.DomUtil.create('ul', 'leaflet-edit-actions', toolbar);
        this._createSaveButton(this._actionsContainer);
        this._createCancelButton(this._actionsContainer);

        return toolbarsContainer;
    },

    enable: function() {
        this._enabled = true;
        this._editButton.classList.remove(this._disabledButtonClass);
    },

    disable: function() {
        this._enabled = false;
        this._editButton.classList.add(this._disabledButtonClass);
    },

    _createEditButton: function(container) {
        var control = this;
        var button = L.DomUtil.create('a', `leaflet-edit-edit ${this._disabledButtonClass}`, container);
        button.href = 'javascript:void(0)';
        button.title = 'Редактировать объекты';
        L.DomEvent
            .on(button, 'click', L.DomEvent.stop)
            .on(button, 'click', function (event) {
                if (!control._enabled) return;
                control._toggleEditMode();
            }, this)
            .on(button, 'dblclick', L.DomEvent.stop); // иначе двойной клик вызывает масштабирование карты
        return button;
    },

    _createSaveButton: function(container) {
        var listItem = L.DomUtil.create('li', '', container);
        var button = L.DomUtil.create('div', 'label', listItem);
        button.innerHTML = 'Сохранить';
        L.DomEvent.on(button, 'click', function() {
            // TODO: save
        });
    },

    _createCancelButton: function(container) {
        var listItem = L.DomUtil.create('li', '', container);
        var button = L.DomUtil.create('div', 'label', listItem);
        button.innerHTML = 'Отмена';
        var control = this;
        L.DomEvent.on(button, 'click', function() {
            control._cancel();
        });
    },

    _toggleEditMode() {
        if (!this._editModeOn) {
            this._enableEditMode();
        }
    },

    _enableEditMode() {
        this._showActionsPanel();
        this._enableEditOnLayers();
        this._editModeOn = true;
    },

    _disableEditMode() {
        this._hideActionsPanel();
        this._disableEditOnLayers(this._getMapLayers());
        if (this._currentEditingObject) {
            this._currentEditingObject.disableEdit();
            this._currentEditingObject = null;
        }

        if (this._map.editTools._drawingEditor) { // From https://github.com/Leaflet/Leaflet.Editable/issues/55
            this._map.editTools._drawingEditor.disable();
        }

        this._editModeOn = false;
    },

    _showActionsPanel: function() {
        this._actionsContainer.classList.add(this._actionsActiveClass);
    },

    _hideActionsPanel: function() {
        this._actionsContainer.classList.remove(this._actionsActiveClass);
    },

    _enableEditOnLayers(layers = this.layers) {
        for (let layer of layers) {

            if (layer.getAllChildMarkers) { // кластер
                this._enableEditOnLayers(layer.getAllChildMarkers());
                continue;
            }

            if (layer instanceof L.LayerGroup) {
                this._enableEditOnLayers(layer.getLayers());
                continue;
            }

            this._backupLayer(layer);

            if (layer instanceof L.Marker) {
                // Маркера делаем перемещаемыми сразу все
                layer.enableEdit && layer.enableEdit(this._map);
                // При попытке перетаскивания маркера сбрасываем текущий выбранный полигон/линию
                const control = this;
                const editableDragHandler = function() {
                    if (control._currentEditingObject) {
                        control._currentEditingObject.disableEdit();
                        control._currentEditingObject = null;
                    }
                }
                L.DomEvent.on(layer, 'editable:dragstart', editableDragHandler);
                layer._editableDragHandler = editableDragHandler; // сохраняем для возможности последующей отвязки
            } else {
                // Для полигонов и линий активируем редактор только после клика.
                // При этом показ попапа переносим на клик по уже редактируемому объекту
                const control = this;
                const map = this._map;
                layer.disablePopup(); // перед обработчиком клика, добавляемым попапом, нужно поставить свой
                const editableClickHandler = function(event) {
                    if (!layer.editEnabled()) {
                        if (control._currentEditingObject) {
                            control._currentEditingObject.disableEdit();
                        }
                        layer.enableEdit && layer.enableEdit(map);
                        control._currentEditingObject = layer;
                        L.DomEvent.stopPropagation(event); // предотвратить отображение попапа
                    }
                };
                L.DomEvent.on(layer, 'click', editableClickHandler);
                layer._editableClickHandler = editableClickHandler; // сохраняем для возможности последующей отвязки
                layer.enablePopup();
            }
        }
    },

    _disableEditOnLayers(layers) {
        for (let layer of layers) {

            if (layer.getAllChildMarkers) { // кластер
                this._disableEditOnLayers(layer.getAllChildMarkers());
                continue;
            }

            if (layer instanceof L.LayerGroup) {
                this._disableEditOnLayers(layer.getLayers());
                continue;
            }

            layer.disableEdit && layer.disableEdit();

            if (layer instanceof L.Marker) {
                if (layer._editableDragHandler) {
                    L.DomEvent.off(layer, 'editable:dragstart', layer._editableDragHandler);
                    delete layer._editableDragHandler;
                }
            } else {
                if (layer._editableClickHandler) {
                    L.DomEvent.off(layer, 'click', layer._editableClickHandler);
                    delete layer._editableClickHandler;
                }
            }
        }
    },

    _backupLayer(layer) {
        const id = L.Util.stamp(layer);

        if (!this._layerBackup[id]) {
            if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                this._layerBackup[id] = {
                    latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
                };
            } else if (layer instanceof L.Circle) {
                this._layerBackup[id] = {
                    latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
                    radius: layer.getRadius()
                };
            } else if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                this._layerBackup[id] = {
                    latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
                };
            }
        }
    },

    _restoreLayer: function (layer) {
        var id = L.Util.stamp(layer);

        if (this._layerBackup.hasOwnProperty(id)) {
            const backup = this._layerBackup[id];

            if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                layer.setLatLngs(backup.latlngs);
            } else if (layer instanceof L.Circle) {
                layer.setLatLng(backup.latlng);
                layer.setRadius(backup.radius);
            } else if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                layer.setLatLng(backup.latlng);
            }

            delete this._layerBackup[id];
        }
    },

    _restoreLayers: function(layers) {
        for (let layer of layers) {

            if (layer.getAllChildMarkers) { // кластер
                this._restoreLayers(layer.getAllChildMarkers());
                continue;
            }

            if (layer instanceof L.LayerGroup) {
                this._restoreLayers(layer.getLayers());
                continue;
            }

            this._restoreLayer(layer);
        }
    },

    _cancel: function() {
        this._restoreLayers(this._getMapLayers());
        this._disableEditMode();
    },

    _getMapLayers: function() {
        const result = [];
        this._map.eachLayer(layer => result.push(layer));
        return result;
    }
});
