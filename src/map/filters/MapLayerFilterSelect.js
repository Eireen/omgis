import React from 'react';
import { connect } from 'react-redux';
import Select from '../../filters/Select';

/* Селект фильтра слоя */
class MapLayerFilterSelect extends React.Component {

    render() {
        const { layerId, layersById, selectedFilterId = null, onItemClick } = this.props;

        const filters = layersById[layerId].filters;
        if (!filters || !filters.length) return null;

        let selectedItemId = selectedFilterId;
        const items = [];
        for (let filter of filters) {
            const item = {
                id: filter.id,
                name: filter.label,
            };
            items.push(item);
            if ((selectedItemId === null || selectedItemId === undefined) && filter.is_default) {
                selectedItemId = filter.id;
            }
        }

        // Флаг `brightDisabled` нужен для того, чтоб сделать селект неактивным (запретить выбор), но при этом расцветку оставить такую же,
        // как для активного - то есть не показывать инпут серым, как при обычном disabled (плюс скрыть иконку раскрывающегося списка)
        let brightDisabled = this.props.brightDisabled || false;
        if (filters.length === 1) {
            selectedItemId = filters[0].id;
            brightDisabled = true;
        }

        return (
            <Select items={items} value={selectedItemId} prompt="Выберите фильтр" emptyItemLabel="&nbsp;" onItemClick={onItemClick}
                classes={{ root: 'map_filter_select_root' }} brightDisabled={brightDisabled}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        layersById: state.mapPage.layers.layersById,
    };
}

export default connect(mapStateToProps)(MapLayerFilterSelect);
