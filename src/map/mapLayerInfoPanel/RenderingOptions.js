import React from 'react';
import { connect } from 'react-redux';
import LayerToggle from './LayerToggle';
import OpacityControl from './OpacityControl';
import ThemeSelect from './ThemeSelect';
import ZoomToLayerExtentButton from './ZoomToLayerExtentButton';

class RenderingOptions extends React.Component {

    render() {
        const { layerId } = this.props;

        if (!layerId) return null;

        return (
            <div className="map_layer_filters map_layer_filters_expanded">
                <h3 className="map_layer_filters_header map_layer_filters_header_collapsible">
                    <div className="left_part">
                        <div className="map_layer_filters_header_text">Настройки отображения слоя</div>
                    </div>
                    <div className="right_part">
                        <i className="map_layer_tree_node_arrow icn icn_arrow_down_navy_14x9"></i>
                    </div>
                </h3>
                <div className="map_layer_filters_content map_layer_info_content">
                    <LayerToggle />
                    <ZoomToLayerExtentButton />
                    <OpacityControl />
                    <ThemeSelect />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        layerId: state.mapPage.layers.infoLayerId,
    };
}

export default connect(mapStateToProps)(RenderingOptions);
