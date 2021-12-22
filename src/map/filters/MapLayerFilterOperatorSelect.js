import Select from '../../filters/Select';
import React from 'react';
import { connect } from 'react-redux';

/* Селект оператора в фильтре слоя */
class MapLayerFilterOperatorSelect extends React.Component {

    getOperators() {
        const {
            layerId, filterId,
            layersById,
        } = this.props;

        const layerFiltersConfig = layersById[layerId].filters;
        // if (!layerFiltersConfig || !layerFiltersConfig.length) return null;

        for (let filter of layerFiltersConfig) {
            if (filter.id === filterId) {
                return filter.operators;
            }
        }

        return [];
    }

    render() {
        const { layerId, layersById, selectedOperatorId = null, defaultOperatorId,
            allComparisonOperatorsById, onItemClick,
        } = this.props;

        const operators = this.getOperators();

        let selectedItemId = selectedOperatorId;
        const items = [];
        for (let op of operators) {
            const opConfig = allComparisonOperatorsById[op.operatorId];
            const item = {
                id: op.operatorId,
                name: opConfig.label,
            };
            items.push(item);
            if ((selectedItemId === null || selectedItemId === undefined) && op.operatorId === defaultOperatorId) {
                selectedItemId = op.operatorId;
            }
        }

        return (
            <Select items={items} value={selectedItemId} canBeEmpty={false} emptyItemLabel="" onItemClick={onItemClick}
                classes={{ root: 'map_filter_select_root' }}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        layersById: state.mapPage.layers.layersById,
        allComparisonOperatorsById: state.mapPage.layers.references.allComparisonOperatorsById,
    };
}

export default connect(mapStateToProps)(MapLayerFilterOperatorSelect);
