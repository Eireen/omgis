import React from 'react';
import MapMenuPanelHeader from '../MapMenuPanelHeader';
import MapLayersFilters from './MapLayersFilters';

export default class MapFilterPanel extends React.Component {

    render() {
        return (
            <div className="map_menu_panel map_layers_panel">
                <MapMenuPanelHeader>Фильтры слоёв</MapMenuPanelHeader>
                <div className="map_menu_panel_content">
                    <div className="scrollable">
                        <MapLayersFilters />
                    </div>
                </div>
            </div>
        );
    }
}
