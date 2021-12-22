import React from 'react';
import { creators as mapPageActionCreators } from '../../actions/mapPage';
import { connect } from 'react-redux';

class ZoomToLayerExtentButton extends React.Component {

    onClick = () => {
        this.enableLayer();
        this.zoomToLayerExtent();
    }

    enableLayer() {
        const {
            layerId, dispatch,
            layersById, references, visibleLayerIds,
        } = this.props;

        if (~visibleLayerIds.indexOf(layerId)) return; // слой уже включён

        dispatch(
            mapPageActionCreators.layers.toggleLayers({
                layerIds: [ layerId ],
                layersById, references, visibleLayerIds,
            })
        );
    }

    zoomToLayerExtent() {
        const { layerId, dispatch } = this.props;

        dispatch(
            mapPageActionCreators.layers.startZoomingToLayerExtent({
                layerId,
            })
        );
    }

    render() {
        return (
            <button type="button" className="map_layer_filter_button map_menu_zoom_to_layer_extent_button" onClick={this.onClick}>
                <i className="icn icn_search"></i>
                Масштабировать до полного охвата
            </button>
        );
    }
}

function mapStateToProps(state) {
    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        layerId: state.mapPage.layers.infoLayerId,
        layersById: state.mapPage.layers.layersById,
        references: state.mapPage.layers.references,
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
    };
}

export default connect(mapStateToProps)(ZoomToLayerExtentButton);
