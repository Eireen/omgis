import MapLayerTreeNodeList from './MapLayerTreeNodeList';
import React from 'react';

/* Компонент, отвечающий за анимированное раскрытие списка вложенных узлов */
export default class MapLayerTreeNodesDropdown extends React.Component {

    render() {
        const { nodes, nestingLevel, baseRef } = this.props;

        return (
            <div className="map_layer_tree_animation_wrap" ref={baseRef}>
                <MapLayerTreeNodeList {...{ nodes, nestingLevel }} />
            </div>
        );
    }
}
