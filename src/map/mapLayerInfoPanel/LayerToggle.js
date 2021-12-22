import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';

// Галочка включения слоя внутри панели информации о слое
class LayerToggle extends React.Component {

    onCheckboxChange = () => {
        const {
            layerId, dispatch,
            layersById, references, visibleLayerIds,
        } = this.props;

        dispatch(
            mapPageActionCreators.layers.toggleLayers({
                layerIds: [ layerId ],
                layersById, references, visibleLayerIds,
            })
        );
    }

    render() {
        const { layerId, isOn } = this.props;

        return (
            <label className="map_layer_tree_node_label map_layer_rendering_options_toggle_layer">
                <div className="checkbox map_layer_tree_node_checkbox">
                    <input type="checkbox" name="layers" value={layerId} checked={isOn} autoComplete="off" onChange={this.onCheckboxChange} />
                    <div className="tick"></div>
                </div>
                Отображать на карте
            </label>
        );
    }
}

function mapStateToProps(state) {
    // ID слоя, инфопанель которого просматривается пользователем в данный момент
    const layerId = state.mapPage.layers.infoLayerId;

    return {
        layerId,
        isOn: !!(layerId && ~state.mapPage.layers.visibleLayerIds.indexOf(layerId)),
        layersById: state.mapPage.layers.layersById,
        references: state.mapPage.layers.references,
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
    };
}

export default connect(mapStateToProps)(LayerToggle);
