import { connect } from 'react-redux';
import MapLayerTreeNodeList from './MapLayerTreeNodeList';
import React from 'react';

class MapLayerTree extends React.Component {

    render() {
        const { layerTree } = this.props;

        const nestingLevel = 0;

        return (
            !!layerTree &&
                <div className="map_layer_tree">
                    <MapLayerTreeNodeList nodes={layerTree} nestingLevel={nestingLevel} />
                </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        layerTree: state.mapPage.layers.layerTree,
    };
}

export default connect(mapStateToProps)(MapLayerTree);
