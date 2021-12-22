import cx from 'classnames';
import React from 'react';
import LayerInfoButton from './mapLayerInfoPanel/LayerInfoButton';

class MapLayerTreeLeafNode extends React.Component {

    render() {
        const { node: { id: layerId, title, icon, isActive }, nestingLevel = 0, isOn, onCheckboxChange } = this.props;
        const isDisabled = !isActive;

        const baseClasses = cx('map_layer_tree_node map_layer_tree_node_leaf', {
            map_layer_tree_node_on: isOn,
            map_layer_tree_node_disabled: isDisabled,
        });
        const labelClasses = `map_layer_tree_node_label map_layer_tree_node_label_level_${nestingLevel}`;
        const iconClasses = icon ? cx('icn', icon) : '';

        return (
            <li className={baseClasses}>
                <div className="map_layer_tree_node_header">
                    <div className="left_part">
                        <label className={labelClasses}>
                            <div className="checkbox map_layer_tree_node_checkbox">
                                <input type="checkbox" name="layers" value={layerId} checked={isOn} autoComplete="off" disabled={isDisabled} onChange={onCheckboxChange} />
                                <div className="tick"></div>
                            </div>
                            { !!icon &&
                                <div className="map_layer_tree_node_icon_wrap">
                                    <i className={iconClasses}></i>
                                </div>
                            }
                            {title}
                        </label>
                    </div>
                    <div className="right_part">
                        <LayerInfoButton layerId={layerId} />
                    </div>
                </div>
            </li>
        );
    }
}

export default MapLayerTreeLeafNode;
