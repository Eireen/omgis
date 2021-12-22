import MapLayerTreeGroupNode from './MapLayerTreeGroupNode';
import MapLayerTreeLeafNodeContainer from './MapLayerTreeLeafNodeContainer';
import React from 'react';

export default class MapLayerTreeNodeList extends React.Component {

    render() {
        const { nodes, nestingLevel = 0 } = this.props;

        return (
            !!nodes &&
                <ul className="map_layer_tree_node_list">
                    {nodes.map(node => {
                        const key = node.subnodes
                            ? node.title
                            : node.id;
                        return node.subnodes
                            ? <MapLayerTreeGroupNode {...{ node, nestingLevel, key }} />
                            : <MapLayerTreeLeafNodeContainer {...{ node, nestingLevel, key }} />;
                    })}
                </ul>
        );
    }
}
