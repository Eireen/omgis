import update from 'immutability-helper';
import Leaflet from 'leaflet';
import LeafletWMS from 'leaflet.wms';
// import LeafletWMS from '../../node_modules/leaflet.wms/src/leaflet.wms'; // for debug
import React from 'react';
import { connect } from 'react-redux';
import appConfig from '../config.json';
// import OldMessyMapper from './OldMessyMapper';
import { creators as mapPageActionCreators } from '../actions/mapPage';

class MapLayerManager extends React.Component {

    state = {
        visibleLayersById: {},
        wmsSource: null,

        // здесь запоминаем выбранные слои, делегирующие свою загрузку группам (с группировкой по group id)
        // Временно перенесено из старого кода
        selectedLayersByGroups: {},
    }

    componentDidMount() {
        /* https://maps.example.com/wmsnik_server?service=WMS&request=GetMap&version=1.1.1&layers=1,2&themes=1,2&styles=&format=image%2Fpng&transparent=true&info_format=text%2Fhtml&tiled=false&width=1275&height=400&srs=EPSG%3A3857&bbox=-11933960.352107998%2C5131676.330953596%2C-8815329.598072808%2C6110070.293003851 */
        const wmsSource = LeafletWMS.source(
            appConfig.wmsBaseUrl,
            {
                format: 'image/png',
                transparent: true,
                attribution: '',
                info_format: 'text/html',
                tiled: false,
                identify: false, // пока отключить GetFeatureInfo по клику
            }
        );
        this.setState({ wmsSource });
    }

    componentDidUpdate(prevProps) {
        this.updateVisibleLayers(prevProps);
    }

    updateVisibleLayers(prevProps) {
        const { visibleLayerIds, selectedThemeIds, filter, opacityByLayerId } = prevProps;
        const { visibleLayerIds: nextVisibleLayerIds, selectedThemeIds: nextSelectedThemeIds, filter: nextFilter, layerConfigsById, opacityByLayerId: nextOpacityByLayerId } = this.props;

        const selectedThemesChanged = selectedThemeIds !== nextSelectedThemeIds;
        const opacityChanged = opacityByLayerId !== nextOpacityByLayerId;

        if (visibleLayerIds === nextVisibleLayerIds && !selectedThemesChanged && !opacityChanged && filter === nextFilter) return;

        // Добавление/удаление слоёв
        let addedLayerIds = [], removedLayerIds = [];
        if (visibleLayerIds.length < nextVisibleLayerIds.length) {
            // Были включёны новые слои
            addedLayerIds = nextVisibleLayerIds.filter(item => !visibleLayerIds.includes(item));
            this.addLayers(addedLayerIds, this.props);
        } else if (visibleLayerIds.length > nextVisibleLayerIds.length) {
            // Были отключены слои
            removedLayerIds = visibleLayerIds.filter(item => !nextVisibleLayerIds.includes(item));
            this.removeLayers(removedLayerIds, this.props);
        }

        // Определяем слои, фильтры которых изменились
        const layerIdsToUpdateByType = {
            geojson: [],
            wms: [],
        };
        if (filter !== nextFilter) {
            for (let layerId in nextFilter.filtersByLayerId) {
                const currentLayerFilters = filter.filtersByLayerId[layerId];
                const nextLayerFilters = nextFilter.filtersByLayerId[layerId];
                if (JSON.stringify(currentLayerFilters) !== JSON.stringify(nextLayerFilters)) {
                    // Group changed layers by types
                    const layerConfig = layerConfigsById[layerId];
                    layerIdsToUpdateByType[
                        layerConfig.type === 2 ? 'geojson' : 'wms'
                    ].push(layerId);
                }
            }
        }

        if (layerIdsToUpdateByType.geojson.length || selectedThemesChanged || opacityChanged) {
            this.updateGeoJSONLayersWithNewParams(layerIdsToUpdateByType.geojson, {
                filter: nextFilter,
                selectedThemeIds: nextSelectedThemeIds,
                opacityByLayerId: nextOpacityByLayerId,
            });
        }
        if (layerIdsToUpdateByType.wms.length || selectedThemesChanged || opacityChanged) {
            this.updateWMSLayersWithNewParams({
                filter: nextFilter,
                selectedThemeIds: nextSelectedThemeIds,
                opacityByLayerId: nextOpacityByLayerId,
            });
        }
    }

    updateGeoJSONLayersWithNewParams(changedLayerIds, { filter }) {
        // TODO
        console.log('TODO: updating GeoJSON layers');
    }

    updateWMSLayersWithNewParams({ filter, selectedThemeIds, opacityByLayerId }) {
        const { wmsSource } = this.state;

        wmsSource.setWMSParams({
            filter: JSON.stringify(filter),
            themes: selectedThemeIds.join(','),
            opacity: JSON.stringify(opacityByLayerId),
        });

        wmsSource.refreshOverlay();
    }

    async addLayers(addedLayerIds) {
        const newLayersById = {};

        for (let layerId of addedLayerIds) {

            const layerConfig = this.props.layerConfigsById[layerId];
            if (!layerConfig) {
                console.error(`Cannot find layer with ID = ${layerId}`);
                continue;
            }

            let layer;

            switch (layerConfig.type) {
                case 1:
                    // Tile layer
                    layer = this.addTileLayer(layerConfig);
                    break;
                case 2:
                    // GeoJSON layer
                    layer = await this.addGeoJSONLayer(layerConfig);
                    break;
                case 3:
                    // WMS layer
                    layer = this.addWMSLayer(layerConfig, this.props);
                    break;
                default:
                    console.error(`Unknown layer type: ${layerConfig.type}`);
                    continue;
            }

            newLayersById[layerConfig.id] = layer;
        }

        this.setState(prevState => update(prevState, {
            visibleLayersById: { $merge: newLayersById },
        }));
    }

    removeLayers(removedLayerIds) {
        const { visibleLayersById } = this.state;

        for (let layerId of removedLayerIds) {
            const layer = visibleLayersById[layerId];
            if (layer === undefined) {
                console.warn(`Layer with ID ${layerId} is already removed from the map`);
                continue;
            }
            layer.remove();
        }

        this.setState(prevState => update(prevState, {
            visibleLayersById: { $unset: removedLayerIds },
        }));
    }

    addTileLayer(layerConfig) {
        const { url, url2x } = layerConfig.tileLayer;
        const layer = Leaflet.tileLayer(Leaflet.Browser.retina && url2x ? url2x : url
            // , { maxZoom: 19 }  // TODO: мб, добавить в таблицу tile_layer столбец `renderer_options`
        ).addTo(this.props.map);
        return layer;
    }

    async addGeoJSONLayer(layerConfig) {
        /*// TODO: теперь этот обработчик вроде не нужен - научились рисовать GeoJSON Mapnik-ом
        const oldMessyRenderer = new OldMessyMapper(this.props.map);

        // const interdependentLayersByGroupId = {};
        // TODO: здесь нужно передавать значение фильтра "Тип груза" (для "Грузоперевозок")
        const selectedGroupedLayerIds = [];

        const layerGroup = await oldMessyRenderer.staticLayerBuilder(layerConfig, {}, selectedGroupedLayerIds);
        layerGroup.addTo(this.props.map);
        oldMessyRenderer.destruct();

        return layerGroup;*/

        return Leaflet.layerGroup();
    }

    addWMSLayer(layerConfig) {
        const { filter } = this.props;
        const { wmsSource } = this.state;

        wmsSource.setWMSParams({ filter: JSON.stringify(filter) });

        const layer = wmsSource.getLayer(layerConfig.id).addTo(this.props.map);
        return layer;
    }

    render() {
        const { wmsSource } = this.state;

        if (!wmsSource) return null;

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
        filter: state.mapPage && state.mapPage.filter,
    };
}

export default connect(mapStateToProps)(MapLayerManager);
