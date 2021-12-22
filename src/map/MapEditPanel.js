import React from 'react';
import MapMenuPanelHeader from './MapMenuPanelHeader';

export default class MapEditPanel extends React.Component {

    render() {
        return (
            <div className="map_menu_panel map_layers_panel">
                <MapMenuPanelHeader>Рисование и измерение</MapMenuPanelHeader>
                <div className="map_menu_panel_content">
                    <div className="scrollable"></div>
                </div>
            </div>
        );
    }
}
