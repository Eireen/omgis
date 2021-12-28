import { creators as mapPageActionCreators } from '../actions/mapPage';
import { connect } from 'react-redux';
import { toUpperCaseFirst } from '../utils/string';
import { objectSubset } from '../utils/common';
import api from '../api';
import MapPage from './MapPage';
import React from 'react';

class MapPageContainer extends React.Component {

    componentDidMount() {
        this.mounted = true; // Fix warning "You called setState() on an unmounted component"

        if (!this.props.layerTree || !this.props.layerTree.length) {
            this.loadLayers();
        }
    }

    componentWillUnmount() {
        this.mounted = false;

        this.props.resetLayersOpacity();
    }

    async loadLayers() {
        const { layerTree, references: layerTreeReferences } = await api.loadMapLayerCatalog();
        /*const layerTree = [
            {
                id: 1,
                title: 'Бассейны ВВП',
                selectionType: 'multiple',
                isOpenByDefault: false,
                isInDevMode: false,
                // visible: true,
                // group_load: false,
                // has_period_filter: false,
                // order_number: 1,
                // period_default_start: null,
                // period_default_end: null,
                // renderer: null,
                subnodes: [
                    {
                        id: 1,
                        title: 'Администрации бассейнов',
                        icon: 'icn_arrow_marker_green',
                        isSelectedByDefault: false,
                        isActive: true,
                        type: null,
                        url: null,
                        url2x: null,
                        utfgridOptions: null,
                        utfgridUrl: null,
                        autoUpdateInterval: null,
                        defaultZIndex: 3001,
                        isInDevMode: false,
                        // code: 'lock',
                        // has_opacity_control: true,
                        // layer_group_id: 1,
                        // options: null,
                        // order_number: 0,
                        // visible: true,
                    },
                    {
                        id: 2,
                        title: 'Филиалы администраций',
                        icon: 'icn_arrow_marker_blue',
                        isSelectedByDefault: false,
                        isActive: true,
                        type: null,
                        url: null,
                        url2x: null,
                        utfgridOptions: null,
                        utfgridUrl: null,
                        autoUpdateInterval: null,
                        defaultZIndex: 3001,
                        isInDevMode: false,
                    },
                    {
                        id: 3,
                        title: 'Водные пути',
                        icon: 'icn_arrow_marker_grey',
                        isSelectedByDefault: false,
                        isActive: true,
                        type: null,
                        url: null,
                        url2x: null,
                        utfgridOptions: null,
                        utfgridUrl: null,
                        autoUpdateInterval: null,
                        defaultZIndex: 3001,
                        isInDevMode: false,
                    },
                    {
                        id: 2,
                        title: 'Схемы судовых ходов',
                        selectionType: 'multiple',
                        isOpenByDefault: false,
                        isInDevMode: false,
                        subnodes: [
                            {
                                id: 5,
                                title: 'По категориям',
                                icon: 'icn_ship_way_category_1',
                                isSelectedByDefault: false,
                                isActive: true,
                                type: null,
                                url: null,
                                url2x: null,
                                utfgridOptions: null,
                                utfgridUrl: null,
                                autoUpdateInterval: null,
                                defaultZIndex: 3001,
                                isInDevMode: false,
                            },
                            {
                                id: 6,
                                title: 'По бассейнам',
                                icon: 'icn_ship_way_category_7',
                                isSelectedByDefault: false,
                                isActive: true,
                                type: null,
                                url: null,
                                url2x: null,
                                utfgridOptions: null,
                                utfgridUrl: null,
                                autoUpdateInterval: null,
                                defaultZIndex: 3001,
                                isInDevMode: false,
                            },
                        ],
                    },
                ],
            },
        ];*/

        if (!this.mounted) return;

        this.props.updateLayerTree(layerTree, layerTreeReferences);
        this.setDefaultActiveNodes(layerTree);
    }

    setDefaultActiveNodes(layerTree) {
        /* Обёртка над `setDefaultActiveNodes` из `mapDispatchToProps`
        для получения доступа к this.props */

        const { layersById, references, visibleLayerIds } = this.props;

        this.props.setDefaultActiveNodes({ layerTree, layersById, references, visibleLayerIds });
    }

    render() {
        const { layerTree } = this.props;

        return (
            !!layerTree &&
                <MapPage layerTree={layerTree} />
        );
    }
}

/* Вытягиваем из дерева ID узлов, которые раскрыты (группы) или включены (слои) по умолчанию */
function getEnabledByDefaultNodeIds(layerTree, openNodeIds = [], visibleLayerIds = []) {
    for (let node of layerTree) {
        if (node.isOpenByDefault) {
            openNodeIds.push(node.id);
        } else if (node.isSelectedByDefault) {
            visibleLayerIds.push(node.id);
        }

        if (node.subnodes) {
            getEnabledByDefaultNodeIds(node.subnodes, openNodeIds, visibleLayerIds);
        }
    }
    return { openNodeIds, visibleLayerIds };
}

function mapStateToProps(state) {
    return objectSubset(state.mapPage.layers, [
        'layerTree',
        'layersById',
        'references',
        'visibleLayerIds',
    ]);
}

function mapDispatchToProps(dispatch) {
    return {
        updateLayerTree: function(layerTree, layerTreeReferences) {
            dispatch(
                mapPageActionCreators.layers.setLayerTree({ layerTree, references: layerTreeReferences })
            );
        },
        setDefaultActiveNodes: function({ layerTree, layersById, references, visibleLayerIds }) {
            const { openNodeIds, visibleLayerIds: defaultVisibleLayerIds } = getEnabledByDefaultNodeIds(layerTree);
            if (openNodeIds.length) {
                dispatch(
                    mapPageActionCreators.layers.toggleLayerGroups(openNodeIds)
                );
            }
            if (defaultVisibleLayerIds.length) {
                dispatch(
                    mapPageActionCreators.layers.toggleLayers({
                        layerIds: defaultVisibleLayerIds,
                        layersById, references, visibleLayerIds,
                    })
                );
            }
        },
        resetLayersOpacity: function() {
            // Сброс кастомных настроек прозрачности слоёв при выходе из раздела карты
            dispatch(
                mapPageActionCreators.layers.resetLayersOpacity()
            );
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPageContainer);
