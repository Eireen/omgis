import React from 'react';
import { connect } from 'react-redux';
import LayerInfo from './LayerInfo';
import RenderingOptions from './RenderingOptions';
import MapMenuPanelHeader from '../MapMenuPanelHeader';
import BackButton from './BackButton';

class MapLayerInfoPanel extends React.Component {

    render() {
        const { layerId, layersById } = this.props;

        const layerConfig = layersById[layerId];
        if (!layerConfig) {
            console.error(`Cannot find layer config for layerId = ${layerId}`);
            return null;
        }

        return (
            <div className="map_menu_panel map_layers_panel">
                <div className="map_menu_panel_header_fixed_wrap">
                    <MapMenuPanelHeader>{layerConfig.title}</MapMenuPanelHeader>
                    <div className="map_menu_panel_header_fixed_buttons_wrap map_menu_panel_header_fixed_buttons_single_button">
                        <BackButton />
                    </div>
                </div>
                <div className="map_menu_panel_content">
                    <div className="scrollable">
                        {!!layerConfig.description &&
                            <LayerInfo content={layerConfig.description} />
                        }
                        <RenderingOptions />
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        layerId: state.mapPage.layers.infoLayerId,
        layersById: state.mapPage.layers.layersById,
    };
}

export default connect(mapStateToProps)(MapLayerInfoPanel);
