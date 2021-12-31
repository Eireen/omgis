import { creators as mapPageActionCreators } from '../actions/mapPage';
import { connect } from 'react-redux';
import { isValidLat, isValidLng, isValidZoom } from '../utils/gis';
import { importAll } from '../utils/import';
import { objectSubset, roundTo } from '../utils/common';
import cx from 'classnames';
import Leaflet from 'leaflet';
import LeafletLocateControl from 'leaflet.locatecontrol';
import MapInteractionManager from './MapInteractionManager';
import MapLayerManager from './MapLayerManager';
import MapPointPopup from './mapPointPopup/MapPointPopup';
import MapPointMarker from './mapPointPopup/MapPointMarker';
import React from 'react';
// import User from '../user/User';

class MapCanvas extends React.Component {

    state = {
        map: null,  // Leaflet Map object
    }

    mapNode = null  // Leaflet Map container

    // Приблизительные границы материковой части РФ.
    // lat_min = 41.310824, lat_max = 76.058508, lng_min = 19.511719 lng_max = 190.195313
    defaultMapBounds = [
        [41.310824, 19.511719],
        [76.058508, 190.195313],
    ]

    componentDidMount() {
        this.addWindowResizeListener();
    }

    componentWillUnmount() {
        this.props.dispatch(
            mapPageActionCreators.mapCanvas.clearMapCanvasSize()
        );

        this.removeWindowResizeListener();
    }

    refCanvas = node => {
        this.mapNode = node;
        if (node) {
            this.initCanvas();
            this.rememberCanvasSize();
        }
    }

    initCanvas() {
        if (!this.mapNode) return;

        const map = Leaflet
            .map(this.mapNode, {
                zoomControl: false,
                scrollWheelZoom: !this.props.staticLayer,
                fadeAnimation: false,
                preferCanvas: true,
                worldCopyJump: true,
                /* С worldCopyJump остаётся проблема: только на одной (большей) из разделенных 180-м меридианом частей карты есть интерактивность:

                https://github.com/Leaflet/Leaflet/issues/1945

                TODO: попробовать добавлять 360 к отрицательным координатам (способ по ссылке) */
            })
            .on('zoomend', () => {
                /* На мелком масштабе надписи показывать при наведении (КОСТЫЛЬ: вынести в плагин) */
                /*setTimeout(() => {
                    const zoom = map.getZoom();
                    this.basinAuthorityPolygons.forEach(item => {
                        const tooltip = item.getTooltip();
                        if (zoom < 4) {
                            if (tooltip.options.permanent) {
                                const tooltipContent = tooltip.getContent();
                                const tooltipOptions = tooltip.options;
                                item.unbindTooltip();
                                item.bindTooltip(tooltipContent, Object.assign({}, tooltipOptions, { permanent: false }));
                            }
                        } else {
                            if (!tooltip.options.permanent) {
                                const tooltipContent = tooltip.getContent();
                                const tooltipOptions = tooltip.options;
                                item.unbindTooltip();
                                item.bindTooltip(tooltipContent, Object.assign({}, tooltipOptions, { permanent: true }));
                            }
                        }
                    });
                }, 0);*/
            });

        map.createPane('polylineEndpointsPane');
        const alertsPane = map.createPane('alertsPane');
        alertsPane.style.zIndex = 630; // выбрано как примерно середина между 600 и 650 (markerPane и tooltipPane соотв-но) - для маркеров алертов, которые должны располагаться выше любых других

        if (this.props.saveCoordsInURL) {
            map.on('moveend', () => {
                this.updateMapPositionInURL(map);
            });
            this.setMapPositionFromURL(map);
        }

        map._layersMaxZoom = 19; // https://github.com/Leaflet/Leaflet.markercluster/issues/611#issuecomment-277670244

        this.addZoomControl(map);

        if (this.props.hasLocateControl) {
            this.addLocateControl(map);
        }

        /* Возможность редактирования карты отключена, т.к. недореализована */
        /*if (User.can('editMapFeaturePosition')) {
            this.addEditControl(map);
            map.on('layerfilter:change', ({ layers }) => {
                this.updateEditControlStatus(layers);
            });
            map.editTools = new L.Editable(map, {
                zIndex: 10000
            });
        }*/

        this.setState({ map });
    }

    updateMapPositionInURL(map) {
        const zoom = map.getZoom();
        const center = map.getCenter();
        const precision = 7; // кол-во знаков после запятой в запоминаемых координатах
        const lat = roundTo(center.lat, precision);
        const lng = roundTo(center.lng, precision);
        const mapPositionStr = [ lat, lng, zoom ].join(',');
        //window.history.replaceState(undefined, undefined, `#${mapPositionStr}`);
        window.location.replace(`#${mapPositionStr}`); // replaceState дико тормозил в Firefox - этот способ кажется чуточку быстрее
    }

    setMapPositionFromURL(map) {
        let setDefaultViewport = true;

        const mapPositionStr = window.location.hash.replace(/^#/, '');
        if (mapPositionStr) {
            // Get map viewbox from hash string
            const coords = mapPositionStr.split(',');
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            const zoom = parseInt(coords[2]);

            if (isValidLat(lat) && isValidLng(lng) && isValidZoom(zoom)) {
                map.setView([ lat, lng ], zoom);
                setDefaultViewport = false;
            } else {
                console.warn(`Invalid map position in URL fragment: lat = ${lat}, lng = ${lng}, zoom = ${zoom}. Showing default bounds.`);
            }
        }

        if (setDefaultViewport) {
            map.fitBounds(this.defaultMapBounds);

            if (mapPositionStr) {
                this.updateMapPositionInURL(map);
            }
        }
    }

    addZoomControl(map) {
        new Leaflet.Control.Zoom({ position: 'topright' }).addTo(map);
    }

    addLocateControl(map) {
        Leaflet.control.locate({
            position: 'topright',
            drawCircle: false,
            markerClass: Leaflet.Marker,
            locateOptions: {
                watch: true,
                enableHighAccuracy: true
            },
            strings: {
                title: 'Моё местоположение',
                popup: 'Вы в радиусе {distance} {unit} от этой точки',
                metersUnit: 'м',
                outsideMapBoundsMsg: 'Вы находитесь за пределами видимой области карты'
            },
            onLocationError: function(err, control) {
                alert('Не удалось определить вашу геопозицию');
                if (window.Rollbar) {
                    window.Rollbar.error('Ошибка геолокации', {
                        error: err,
                        /*user: {
                            id: User.id,
                            name: User.data.name
                        }*/
                    });
                } else {
                    console.log(err);
                }
            }
        }).addTo(map);
    }

    rememberCanvasSize() {
        this.updateCanvasSize();
    }

    updateCanvasSize() {
        this.props.dispatch(
            mapPageActionCreators.mapCanvas.setMapCanvasSize({
                width: this.mapNode.clientWidth,
                height: this.mapNode.clientHeight,
            })
        );
    }

    addWindowResizeListener() {
        window.addEventListener('resize', this.windowResizeListener);
    }

    removeWindowResizeListener() {
        window.removeEventListener('resize', this.windowResizeListener);
    }

    windowResizeListener = () => {
        this.updateCanvasSize();
    }

    render() {
        const { map } = this.state;
        const { visibleLayerIds } = this.props;

        const mapCanvasClasses = cx('map', {
            map_no_layers: !visibleLayerIds.length,
        });

        return (
            <MapLayerManager map={map}>
                <MapInteractionManager map={map}>
                    <div className="map_canvas_container">
                        <div className={mapCanvasClasses} ref={this.refCanvas}></div>
                        <MapPointPopup />
                        <MapPointMarker />
                    </div>
                </MapInteractionManager>
            </MapLayerManager>
        );
    }
}

function mapStateToProps(state) {
    return objectSubset(state.mapPage.layers, ['visibleLayerIds']);
}

/* От кривых путей к иконкам Leaflet-а при обработке вебпаком */
delete Leaflet.Icon.Default.prototype._getIconUrl;
Leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

export default connect(mapStateToProps)(MapCanvas);
