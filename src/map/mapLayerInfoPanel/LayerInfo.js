import React from 'react';

class LayerInfo extends React.Component {

    render() {
        const { content } = this.props;

        if (!content) return null;

        return (
            <div className="map_layer_filters map_layer_filters_expanded">
                <h3 className="map_layer_filters_header map_layer_filters_header_collapsible">
                    <div className="left_part">
                        <div className="map_layer_filters_header_text">Информация о слое</div>
                    </div>
                    <div className="right_part">
                        <i className="map_layer_tree_node_arrow icn icn_arrow_down_navy_14x9"></i>
                    </div>
                </h3>
                <div className="map_layer_filters_content map_layer_info_content" dangerouslySetInnerHTML={{ __html: content }}></div>
            </div>
        );
    }
}

export default LayerInfo;
