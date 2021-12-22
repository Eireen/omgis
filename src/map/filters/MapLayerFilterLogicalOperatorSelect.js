import Select from '../../filters/Select';
import React from 'react';
import { connect } from 'react-redux';

/* Селект логического оператора И/ИЛИ в фильтре слоя */
class MapLayerFilterLogicalOperatorSelect extends React.Component {

    items = [
        {
            id: 'and',
            name: 'И',
        },
        {
            id: 'or',
            name: 'ИЛИ',
        },
    ]

    render() {
        const { selectedOperatorId = null, onItemClick } = this.props;

        return (
            <Select items={this.items} value={selectedOperatorId} canBeEmpty={false} emptyItemLabel="" onItemClick={onItemClick}
                classes={{ root: 'map_filter_select_root map_filters_logical_operator_select' }}
            />
        );
    }
}

function mapStateToProps(state) {
    return {};
}

export default connect(mapStateToProps)(MapLayerFilterLogicalOperatorSelect);
