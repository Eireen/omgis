import { creators as mapPageActionCreators } from '../../actions/mapPage';
import { connect } from 'react-redux';
import MapLayerFilter from './MapLayerFilter';
import MapLayerFilterLogicalOperatorSelect from './MapLayerFilterLogicalOperatorSelect';
import React from 'react';

/* Фильтры активного слоя */
class MapLayerFilters extends React.Component {

    onAddFilterButtonClick = () => {
        const { layerId, dispatch } = this.props;

        dispatch(
            mapPageActionCreators.filters.addFilters({
                layerId,
                filterStates: [ { filterId: null, operatorId: null, value: null } ],
            })
        );
    }

    onLogicalOperatorSelectItemClick = (orGroupIndex, andGroupIndex) => ({ value: logicalOperatorId }) => {
        // orGroupIndex и andGroupIndex - индексы фильтра, ПЕРЕД которым стоит кликнутый селект логического оператора

        const { layerId, dispatch } = this.props;

        if (logicalOperatorId === 'and') {
            // Объединить группы
            dispatch(
                mapPageActionCreators.filters.mergeOrGroups({
                    layerId,
                    orGroupIndex,
                })
            );
        } else {
            // Разбить группы
            dispatch(
                mapPageActionCreators.filters.splitAndGroups({
                    layerId,
                    orGroupIndex,
                    andGroupIndex,
                })
            );
        }
    }

    renderLogicalOperatorSelect(selectedOperatorId, orGroupIndex, andGroupIndex) {
        return (
            <MapLayerFilterLogicalOperatorSelect selectedOperatorId={selectedOperatorId}
                onItemClick={this.onLogicalOperatorSelectItemClick(orGroupIndex, andGroupIndex)}
            />
        );
    }

    render() {
        const { layerId, layersById, activeLayerFilters } = this.props;

        const layerConfig = layersById[layerId];
        const filters = layerConfig.filters;
        if (!filters || !filters.length) return null;

        // Показывать кнопки удаления фильтра только если включённых фильтров больше одного
        const showRemoveFilterButton = activeLayerFilters[0].length > 1 || activeLayerFilters.length > 1;

        return (
            <div className="map_layer_filters map_layer_filters_expanded">
                <h3 className="map_layer_filters_header map_layer_filters_header_collapsible">
                    <div className="left_part">
                        <div className="map_layer_filters_header_text">{layerConfig.title}</div>
                    </div>
                    <div className="right_part">
                        <i className="map_layer_tree_node_arrow icn icn_arrow_down_navy_14x9"></i>
                    </div>
                </h3>
                {/* <div className="map_layer_filters_info">Отображается 1 объект из 6540</div> */}
                <div className="map_layer_filters_content">
                    {activeLayerFilters.map((orGroup, orGroupIndex) => {
                        return (
                            <div key={orGroupIndex} className="map_layer_filter_or_group">
                                {!!orGroupIndex &&
                                    this.renderLogicalOperatorSelect('or', orGroupIndex, null)
                                }
                                {orGroup.map((filterState, andGroupIndex) => {
                                    return (
                                        <div key={`${orGroupIndex}_${andGroupIndex}`} className="map_layer_filter_and_group">
                                            {!!andGroupIndex &&
                                                this.renderLogicalOperatorSelect('and', orGroupIndex, andGroupIndex)
                                            }
                                            <MapLayerFilter {...{ layerId, filterState, orGroupIndex, andGroupIndex, showRemoveFilterButton }} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                    <div className="map_layer_filters_buttons">
                        <button type="button" onClick={this.onAddFilterButtonClick} className="map_layer_filter_button map_layer_filter_button_green">Добавить фильтр</button>
                        <button type="button" className="map_layer_filter_button map_layer_filter_button_red">Сбросить все фильтры</button>
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        layersById: state.mapPage.layers.layersById,
        activeLayerFilters: state.mapPage.sandboxFilter.filtersByLayerId[ownProps.layerId],
    };
}

export default connect(mapStateToProps)(MapLayerFilters);
