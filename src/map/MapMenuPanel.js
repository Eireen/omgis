import { connect } from 'react-redux';
import React from 'react';

class MapMenuPanel extends React.Component {

    findMainMenuItemById(itemId) {
        const { mainMenu: { items: mainMenuItems = [] } = {} } = this.props;

        for (let item of mainMenuItems) {
            if (item.id === itemId) {
                return item;
            }
        }
        return null;
    }

    render() {
        const { mainMenu: { activeItemId: activeMainMenuItemId } = {} } = this.props;

        const activeMainMenuItem = !!activeMainMenuItemId && this.findMainMenuItemById(activeMainMenuItemId);
        const VisibleMenuPanel = !!activeMainMenuItem && activeMainMenuItem.content;

        return (
            !!VisibleMenuPanel && <VisibleMenuPanel />
        );
    }
}

function mapStateToProps(state) {
    return {
        mainMenu: {
            items: state.mapPage.mainMenu.items,
            activeItemId: state.mapPage.mainMenu.activeItemId,
        },
    };
}

export default connect(mapStateToProps)(MapMenuPanel);
