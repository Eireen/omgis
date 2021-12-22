import update from 'immutability-helper';
import Leaflet from 'leaflet';
import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import { decimalDegreesToDMS } from '../utils/gis';

class MapInteractionManager extends React.Component {

    state = {
        visibleLayersById: {},
        wmsSource: null,

        // здесь запоминаем выбранные слои, делегирующие свою загрузку группам (с группировкой по group id)
        // Временно перенесено из старого кода
        selectedLayersByGroups: {},
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        this.destroyMapClickHandler();
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.map && this.props.map) {
            this.setupMapClickHandler(this.props.map);
        }

        if (this.props.zoomingToLayerExtent.layerId && !prevProps.zoomingToLayerExtent.layerId) {
            this.zoomToLayerExtent(this.props.zoomingToLayerExtent.layerId);
        }
    }

    setupMapClickHandler(map) {
        map.on('click', this.mapClickHandler);
    }

    destroyMapClickHandler() {
        const { map } = this.props;

        if (!map) return;

        map.off('click', this.mapClickHandler);
    }

    mapClickHandler = event => {
        /* `event` structure: {
            latlng: { lat: 56.022948079627454, lng: 35.99121093750001 },
            containerPoint: { x: 452, y: 130 },
            layerPoint: { x: 402, y: 106 },
            originalEvent: [click event],
            type: "click",
            target: ...
        }*/
        // console.log(event);
        const { dispatch } = this.props;

        const pointDetails = {
            coords: {
                pixel: {
                    relative: event.containerPoint,
                },
                latLng: event.latlng,
            },
            popup: {
                content: `Decimal: lat = ${event.latlng.lat}, lng = ${event.latlng.lng}<br>` +
                    `Degrees: lat = ${decimalDegreesToDMS(event.latlng.lat)}, lng = ${decimalDegreesToDMS(event.latlng.lng)}`,
            },
        };
        dispatch(
            mapPageActionCreators.pointDetails.showPointDetails(pointDetails)
        );
    }

    zoomToLayerExtent(layerId) {
        const {
            map,
            layerConfigsById,
            dispatch,
        } = this.props;

        const layerConfig = layerConfigsById[layerId];
        if (!layerConfig.extent) {
            console.warn(`No extent data for layer ${layerId}`);
            return;
        }

        // Формат координат в `extent`: x min ymin,xmax, ymax  (т. е. порядок координат lng,lat)
        const bounds = layerConfig.extent.split(',');
        for (let i = 0; i < 2; i++) {
            bounds[i] = bounds[i].split(' ');
            for (let j = 0; j < 2; j++) {
                bounds[i][j] = +bounds[i][j];
            }
            bounds[i].reverse(); // в extent порядок lng,lat, а здесь нужно lat,lng
        }

        map.fitBounds(bounds);

        dispatch(
            mapPageActionCreators.layers.endZoomingToLayerExtent()
        );
    }

    render() {
        const { children } = this.props;

        return (
            children
        );
    }
}

function mapStateToProps(state) {
    return {
        visibleLayerIds: state.mapPage && state.mapPage.layers.visibleLayerIds,
        selectedThemeIds: state.mapPage && state.mapPage.layers.selectedThemeIds,
        opacityByLayerId: state.mapPage && state.mapPage.layers.opacityByLayerId,
        layerConfigsById: state.mapPage && state.mapPage.layers.layersById,
        zoomingToLayerExtent: state.mapPage && state.mapPage.layers.zoomingToLayerExtent,
        filter: state.mapPage && state.mapPage.filter,
    };
}

export default connect(mapStateToProps)(MapInteractionManager);
