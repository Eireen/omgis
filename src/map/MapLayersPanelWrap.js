import MapLayersPanel from './MapLayersPanel';
import MapLayerInfoPanel from './mapLayerInfoPanel/MapLayerInfoPanel';
import React from 'react';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import { connect } from 'react-redux';

class MapLayersPanelWrap extends React.Component {

    componentWillUnmount() {
        this.hideInfoPanel();
    }

    hideInfoPanel = () => {
        const { dispatch } = this.props;

        dispatch(
            mapPageActionCreators.layers.hideLayerInfoPanel()
        );
    }

    render() {
        const { infoLayerId } = this.props;

        return (
            infoLayerId
                ? <MapLayerInfoPanel />
                : <MapLayersPanel />
        );
    }
}

function mapStateToProps(state) {
    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        infoLayerId: state.mapPage.layers.infoLayerId,
    };
}

export default connect(mapStateToProps)(MapLayersPanelWrap);
