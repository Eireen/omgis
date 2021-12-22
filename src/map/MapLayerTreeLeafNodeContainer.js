import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import React from 'react';
import MapLayerTreeLeafNode from './MapLayerTreeLeafNode';

class MapLayerTreeLeafNodeContainer extends React.Component {

    onCheckboxChange = () => {
        const {
            node, dispatch,
            layersById, references, visibleLayerIds,
        } = this.props;

        const nodeId = node && node.id;
        if (!nodeId) return;

        dispatch(
            mapPageActionCreators.layers.toggleLayers({
                layerIds: [ nodeId ],
                layersById, references, visibleLayerIds,
            })
        );
    }

    render() {
        return (
            <MapLayerTreeLeafNode {...this.props} onCheckboxChange={this.onCheckboxChange} />
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        isOn: !!(ownProps.node && ~state.mapPage.layers.visibleLayerIds.indexOf(ownProps.node.id)),
        layersById: state.mapPage.layers.layersById,
        references: state.mapPage.layers.references,
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
    };
}

export default connect(mapStateToProps)(MapLayerTreeLeafNodeContainer);
