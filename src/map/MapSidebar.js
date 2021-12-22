import { connect } from 'react-redux';
import cx from 'classnames';
import MapMenu from './MapMenu';
import React from 'react';

class MapSidebar extends React.Component {

    render() {
        const { isMenuPanelVisible } = this.props;

        const baseClasses = cx('map_sidebar', { map_menu_panel_visible: isMenuPanelVisible });

        return (
            <div className={baseClasses}>
                <div className="scrollable">
                    <MapMenu />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        isMenuPanelVisible: !!state.mapPage.mainMenu.activeItemId,
    };
}

export default connect(mapStateToProps)(MapSidebar);
