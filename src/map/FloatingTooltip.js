/* Тултип с опцией `floating` прикреплять не к центроиду полигона (по умолчанию),
а к полюсу недоступности (pole of inaccessibility, https://ru.wikipedia.org/wiki/Полюс_недоступности),
вычисляемому библиотекой https://github.com/mapbox/polylabel */

import { clone } from '../utils/common';
import Leaflet from 'leaflet';
import polylabel from '@mapbox/polylabel';

(function() {

    const DEBUG_MODE = false;

    if (!Leaflet.Tooltip) return;

    const parent_onAdd = Leaflet.Tooltip.prototype.onAdd;
    const parent_onRemove = Leaflet.Tooltip.prototype.onRemove;

    Leaflet.Tooltip.include({

        onAdd: function (map) {
            parent_onAdd.apply(this, arguments);

            if (this.options.floating && this._source) {
                map.on('moveend', this.onMapMoveEnd, this);
            }
        },

        onRemove: function (map) {
            parent_onRemove.call(this, map);

            if (this._source) {
                map.off('moveend', this.onMapMoveEnd, this);
            }
        },

        onMapMoveEnd: function(event) {
            setTimeout(() => { // без этого код получает старые параметры viewport-а
                if (!this._source || !this._source._map) return;

                const map = this._source._map;

                const tooltipLatLng = getTooltipPoint(this._source, map);
                if (tooltipLatLng) {
                    this.setLatLng(tooltipLatLng);
                }
            }, 0);
        }
    });

    const parent_openTooltip = Leaflet.Layer.prototype.openTooltip;

    Leaflet.Layer.include({

        _clippedPolygon: null, // for debug purposes

        openTooltip: function (layer, latlng) {
            if (!(layer instanceof Leaflet.Layer)) {
                latlng = layer;
                layer = this;
            }

            if (this._map && this._tooltip && this._tooltip.options.floating && !latlng) {
                const tooltipLatLng = getTooltipPoint(this, this._map);
                if (tooltipLatLng) {
                    latlng = tooltipLatLng;
                }
            }

            return parent_openTooltip.call(this, layer, latlng);
        }
    });

    function getTooltipPoint(ownerLayer, map) {
        if (ownerLayer instanceof Leaflet.Polygon) {
            return getTooltipPointForPolygon(ownerLayer, map);
        }
        else if (ownerLayer instanceof Leaflet.Polyline) {
            return getTooltipPointForPolyline(ownerLayer, map);
        }
        else {
            return null;
        }
    }

    function getTooltipPointForPolygon(polygonLayer, map) {
        if (DEBUG_MODE) {
            if (this._clippedPolygon) {
                this._clippedPolygon.remove();
            }
        }

        const clippedPolygon = clipPolygon(polygonLayer, map);
        if (!clippedPolygon.length) return null;

        // в clippedPolygon точки типа Point - преобразовать в массивы чисел
        const clippedPolygonNumerical = clippedPolygon.map(ring =>
            ring.map(point => [ point.x, point.y ])
        );

        // DEV: отображение на карте результата отсечения
        if (DEBUG_MODE) {
            drawClippedPolygon(polygonLayer, clippedPolygon, map);
        }

        /* Сначала вычисляем центроид, затем проверяем, находится ли он внутри полигона -
        если нет, используем полюс недоступности (библиотека polylabel) */

        // Вычисление центроида (Polygon.getCenter() требует добавления слоя на карту)
        const clippedPolygonGeographical = clippedPolygon.map(ring =>
            ring.map(point => map.layerPointToLatLng(point))
        );
        const tempPolygon = Leaflet.polygon(clippedPolygonGeographical, { opacity: 0 }).addTo(map);
        const center = tempPolygon.getCenter();
        tempPolygon.remove();

        const isCenterInsidePolygon = isPointInPolygon(clippedPolygonNumerical[0], map.latLngToLayerPoint(center));

        if (isCenterInsidePolygon) {
            return center;
        } else {
            const polePoint = polylabel(clippedPolygonNumerical);
            return map.layerPointToLatLng(polePoint);
        }
    }

    function getTooltipPointForPolyline(polylineLayer, map) { // NOT WORKING!!! метка пляшет рандомно туда-сюда

        const clippedPolylineRings = clipPolyline(polylineLayer, map);
        if (!clippedPolylineRings.length) return null;

        /* Далее копипаста из Polyline.getCenter */

        var i, halfDist, segDist, dist, p1, p2, ratio,
            points = clippedPolylineRings[0],
            len = points.length;

        if (!len) { return null; }

        // polyline centroid algorithm; only uses the first ring if there are multiple

        for (i = 0, halfDist = 0; i < len - 1; i++) {
            halfDist += points[i].distanceTo(points[i + 1]) / 2;
        }

        // The line is so small in the current view that all points are on the same pixel.
        if (halfDist === 0) {
            return map.layerPointToLatLng(points[0]);
        }

        for (i = 0, dist = 0; i < len - 1; i++) {
            p1 = points[i];
            p2 = points[i + 1];
            segDist = p1.distanceTo(p2);
            dist += segDist;

            if (dist > halfDist) {
                ratio = (dist - halfDist) / segDist;
                return map.layerPointToLatLng([
                    p2.x - ratio * (p2.x - p1.x),
                    p2.y - ratio * (p2.y - p1.y)
                ]);
            }
        }
    }

    function drawClippedPolygon(polygonLayer, clippedPolygon, map) {
        const clippedPolygonGeographical = clippedPolygon.map(ring =>
            ring.map(point => map.layerPointToLatLng(point))
        );
        const mapPolygon = Leaflet.polygon(clippedPolygonGeographical, { color: 'red' }).addTo(map);
        polygonLayer._clippedPolygon = mapPolygon;
    }

    /* Функция Polygon.prototype._clipPoints, переделанная под обрезку видимым окном карты
    (без учета доп. полей вокруг видимой области) */
    function clipPolygon(polygon, map) {

        const bounds = getVisibleMapBounds(map, polygon);

        if (!polygon._pxBounds || !polygon._pxBounds.intersects(bounds)) {
            return [];
        }

        let _parts = [];
        for (var i = 0, len = polygon._rings.length, clipped; i < len; i++) {
            clipped = Leaflet.PolyUtil.clipPolygon(polygon._rings[i], bounds, true);
            if (clipped.length) {
                _parts.push(clipped);
            }
        }

        return _parts;
    }

    /* Функция Polyline.prototype._clipPoints, переделанная под обрезку видимым окном карты
    (без учета доп. полей вокруг видимой области) */
    function clipPolyline(polyline, map) {

        const bounds = getVisibleMapBounds(map, polyline);

        if (!polyline._pxBounds || !polyline._pxBounds.intersects(bounds)) {
            return [];
        }

        var parts = clone(polyline._parts).map(part => part.map(Leaflet.point)),
            i, j, k, len, len2, segment, points;

        for (i = 0, k = 0, len = polyline._rings.length; i < len; i++) {
            points = polyline._rings[i];

            for (j = 0, len2 = points.length; j < len2 - 1; j++) {
                segment = Leaflet.LineUtil.clipSegment(points[j], points[j + 1], bounds, j, true);

                if (!segment) { continue; }

                parts[k] = parts[k] || [];
                parts[k].push(segment[0]);

                // if segment goes out of screen, or it's the last one, it's the end of the line part
                if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
                    parts[k].push(segment[1]);
                    k++;
                }
            }
        }

        return parts;
    }

    function getVisibleMapBounds(map, figure) {
        /* восстанавливаем видимые границы вьюпорта */
        var size = map.getSize(),
            renderer = map.getRenderer(figure),
            clipPaddingPercent = renderer.options.padding,
            clipPaddings = size.multiplyBy(clipPaddingPercent),
            clipBounds = renderer._bounds,
            bounds = new Leaflet.Bounds(
                clipBounds.min.add(clipPaddings).round(),
                clipBounds.max.subtract(clipPaddings).round()
            ),
            w = 1, // толщина линии границы полигона
            p = new Leaflet.Point(w, w);

        // increase clip padding by stroke width to avoid stroke on clip edges
        bounds = new Leaflet.Bounds(bounds.min.subtract(p), bounds.max.add(p));
        return bounds;
    }

    function isPointInPolygon(polygon, point) {
        let isInside = false;

        for (let i = 0, l = polygon.length, j = l - 1; i < l; j = i++) {
            let [ x1, y1 ] = polygon[i];
            let [ x2, y2 ] = polygon[j];

            if ((y1 > point.y) != (y2 > point.y) &&
                point.x < (x2 - x1) * (point.y - y1) / (y2 - y1) + x1)
            {
                isInside = !isInside;
            }
        }

        return isInside;
    }
})();

export default {};
