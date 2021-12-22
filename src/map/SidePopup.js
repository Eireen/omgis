/*
  Попап, располагающийся сбоку от маркера (а не над ним)
*/

import { toPoint } from 'leaflet/src/geometry/Point';
import jQueryActual from '../vendor/jquery.actual/jquery.actual.min';
import L from 'leaflet';

L.SidePopup = L.Popup.extend({

    options: {
        autoPan: false,
        autoPanPadding: [8, 8],
        preferAlign: 'right'
    },

    _updatePosition:function () {
        if (!this._map) { return; }

        var pos = this._map.latLngToLayerPoint(this._latlng),
            offset = toPoint(this.options.offset),
            anchor = this._getAnchor(),
            sideMargin = 35; // отступ от точки привязки

        if (this._zoomAnimated) {
            L.DomUtil.setPosition(this._container, pos.add(anchor));
        } else {
            offset = offset.add(pos).add(anchor);
        }

        var marginTop = parseInt(L.DomUtil.getStyle(this._container, 'marginTop'), 10) || 0,
            containerHeight = this._container.offsetHeight + marginTop,
            containerWidth = this._containerWidth,
            top = this._containerTop = -Math.round(containerHeight / 2) + offset.y,
            left;

        var containerPos = this._map.layerPointToContainerPoint(pos),
            padding = toPoint(this.options.autoPanPadding),
            paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding),
            paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding),
            size = this._map.getSize(),
            dx = 0,
            dy = 0;

        // Where can we fit the popup ?
        var canGoLeft  = containerPos.x - sideMargin - containerWidth - Math.abs(paddingTL.x) >= 0,
            canGoRight = containerPos.x + sideMargin + containerWidth + Math.abs(paddingBR.x) <= size.x;

        var leftForLeftAlign = this._containerLeft = -containerWidth - sideMargin;
        var leftForRightAlign = this._containerLeft = sideMargin;

        if (this.options.preferAlign === 'left') {
            left = canGoLeft ? leftForLeftAlign : leftForRightAlign;
        } else {
            left = canGoRight ? leftForRightAlign : leftForLeftAlign;
        }

        var layerPos = toPoint([ left, top ]);
        layerPos._add(L.DomUtil.getPosition(this._container));
        var containerPopupPos = this._map.layerPointToContainerPoint(layerPos);
        if (containerPopupPos.y + containerHeight + paddingBR.y > size.y) { // заходит ли за нижний край карты
            dy = containerPopupPos.y + containerHeight + paddingBR.y - size.y;
            top -= dy;
            containerPopupPos.y -= dy;
        }
        if (containerPopupPos.y - paddingTL.y < 0) { // заходит ли за верхний край карты
            top += Math.abs(containerPopupPos.y) + paddingTL.y;
        }

        this._container.style.top = top + 'px';
        this._container.style.left = left + 'px';
    },

    /* Пришлось переопределять из-за добавления Leaflet-ом одного пикселя к макс. ширине попапа (появлялась светлая полоска сбоку видео) */
    _updateLayout: function () {
        var container = this._contentNode,
            style = container.style;

        style.width = '';
        style.whiteSpace = 'nowrap';

        var width = container.offsetWidth;
        width = Math.min(width, this.options.maxWidth);
        width = Math.max(width, this.options.minWidth);

        style.width = width + 'px';
        style.whiteSpace = '';

        style.height = '';

        var height = container.offsetHeight,
            maxHeight = this.options.maxHeight,
            scrolledClass = 'leaflet-popup-scrolled';

        if (maxHeight && height > maxHeight) {
            style.height = maxHeight + 'px';
            L.DomUtil.addClass(container, scrolledClass);
        } else {
            L.DomUtil.removeClass(container, scrolledClass);
        }

        this._containerWidth = this._container.offsetWidth;
    },

    /* Подгоняет ширину попапа под контент (растягивает при необходимости) */
    adjustWidthByContent: function() {
        this._adjustWidthByTitle();
    },

    /* Подгоняет ширину попапа под ширину заголовка (растягивает при необходимости) */
    _adjustWidthByTitle: function() {
        const currentPopupWidth = this._container.offsetWidth;

        const headerLeftPart = this._container.querySelector('.header .left_part');
        const headerCloseButton = this._container.querySelector('.header .close_button');
        const headerWidth =
            (headerLeftPart && headerLeftPart.offsetWidth || 0) +
            (headerCloseButton && headerCloseButton.offsetWidth || 0);

        if (headerWidth > currentPopupWidth) {
            this._container.querySelector('.leaflet-popup-content').style.width = `${headerWidth}px`;
        }
    }
});
