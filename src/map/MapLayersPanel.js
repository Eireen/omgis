import MapLayerTree from './MapLayerTree';
import React from 'react';
import MapMenuPanelHeader from './MapMenuPanelHeader';

export default class MapLayersPanel extends React.Component {

    render() {
        return (
            <div className="map_menu_panel map_layers_panel">
                <MapMenuPanelHeader>Каталог слоёв</MapMenuPanelHeader>
                <div className="map_menu_panel_content">
                    <div className="scrollable">
                        <MapLayerTree />
                    </div>
                </div>
            </div>
        );
    }
}
