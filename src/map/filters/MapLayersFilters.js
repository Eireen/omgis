import { creators as mapPageActionCreators } from '../../actions/mapPage';
import update from 'immutability-helper';
import MapLayerFilters from './MapLayerFilters';
import { connect } from 'react-redux';
import React from 'react';

/* Фильтры активных слоёв */
class MapLayersFilters extends React.Component {

    state = {
        // Флаг сброса sandbox-фильтра в дефолтное состояние (копию активного фильтра).
        // При отображении раздела "Фильтры" активный фильтр из Redux-стора нужно скопировать в sandbox-фильтр
        // (sandbox-фильтр - это который редактируется пользователем, но ещё не применяется к карте)
        sandboxFilterInited: false,
    }

    componentDidMount() {
        this.initSandboxFilter();
    }

    initSandboxFilter() {
        const { activeFiltersByLayerId, dispatch } = this.props;

        dispatch(
            mapPageActionCreators.filters.applySandboxFilters({ // установка песочного фильтра целиком
                filtersByLayerId: activeFiltersByLayerId,
            })
        );

        this.setState(prevState => update(prevState, { sandboxFilterInited: { $set: true } }));
    }

    render() {
        const { visibleLayerIds } = this.props;
        const { sandboxFilterInited } = this.state;

        if (!visibleLayerIds.length || !sandboxFilterInited) return null;

        return (
            <div>
                {visibleLayerIds.map(layerId => <MapLayerFilters layerId={layerId} key={layerId} />)}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
        activeFiltersByLayerId: state.mapPage.filter.filtersByLayerId,
    };
}

export default connect(mapStateToProps)(MapLayersFilters);
