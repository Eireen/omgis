import { connect } from 'react-redux';
import MapMainMenu from './MapMainMenu';
import MapMenuPanel from './MapMenuPanel';
import React from 'react';

class MapMenu extends React.Component {

    render() {
        const { isMenuPanelVisible } = this.props;

        return (
            <div className="map_menu">
                <MapMainMenu />
                { !!isMenuPanelVisible && <MapMenuPanel /> }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        isMenuPanelVisible: !!state.mapPage.mainMenu.activeItemId,
    };
}

export default connect(mapStateToProps)(MapMenu);
