import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import { FirstChild } from '../utils/common';
import cx from 'classnames';
import MapLayerTreeNodesDropdown from './MapLayerTreeNodesDropdown';
import React from 'react';
import { Transition } from 'react-transition-group';
import Velocity from 'velocity-animate';

class MapLayerTreeGroupNode extends React.Component {

    animationDuration = 300

    dropdownRef = React.createRef();

    render() {
        const { node: { title, subnodes }, nestingLevel = 0, isOpen = false, onNodeHeaderClick } = this.props;

        const baseClasses = cx('map_layer_tree_node map_layer_tree_node_group', {
            map_layer_tree_node_on: isOpen,
        });
        const labelClasses = `map_layer_tree_node_label map_layer_tree_node_label_level_${nestingLevel}`;

        return (
            <li className={baseClasses}>
                <div className="map_layer_tree_node_header">
                    <div className="left_part" onClick={onNodeHeaderClick}>
                        <label className={labelClasses}>
                            <i className="map_layer_tree_node_arrow icn icn_arrow_down_navy_14x9"></i>
                            {title}
                        </label>
                        { /*<div className="opacity_control_slider">
                            <input className="" type="range" min="0" max="100" step="1" name="opacity_layer_group_10" autoComplete="off" data-layer-id="layer_group_10" data-is-group-layer="true" />
                        </div> */}
                    </div>
                    <div className="right_part">
                        {/*<div className="opacity_control_button">
                            <div className="value">100%</div>
                            <i className="icn icn_brightness_slate"></i>
                            <i className="icn icn_brightness_navy"></i>
                            <i className="icn icn_cross_slate"></i>
                        </div> */}
                    </div>
                </div>
                <Transition
                    in={isOpen}
                    timeout={0}
                    nodeRef={this.dropdownRef}
                    onEnter={() => {
                        Velocity(this.dropdownRef.current, 'slideDown', { duration: this.animationDuration });
                    }}
                    onExit={() => {
                        Velocity(this.dropdownRef.current, 'slideUp', { duration: this.animationDuration });
                    }}
                    mountOnEnter
                >
                    <MapLayerTreeNodesDropdown nodes={subnodes} nestingLevel={nestingLevel + 1} baseRef={this.dropdownRef} />
                </Transition>
            </li>
        );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        isOpen: !!(ownProps.node && ~state.mapPage.layers.openLayerTreeNodeIds.indexOf(ownProps.node.id)),
    };
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onNodeHeaderClick: function() {
            const nodeId = ownProps.node && ownProps.node.id;
            if (!nodeId) return;
            dispatch(
                mapPageActionCreators.layers.toggleLayerGroups([ nodeId ])
            );
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MapLayerTreeGroupNode);
