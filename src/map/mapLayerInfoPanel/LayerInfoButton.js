import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';

class LayerInfoButton extends React.Component {

    toggleInfoPanel = () => {
        const { dispatch, layerId } = this.props;

        dispatch(
            mapPageActionCreators.layers.showLayerInfoPanel({ layerId })
        );
    }

    render() {
        return (
            <button type="button" className="map_layer_button" onClick={this.toggleInfoPanel}>
                <i className="icn icn_gear_16x16"></i>
            </button>
        );
    }
}

export default connect()(LayerInfoButton);
