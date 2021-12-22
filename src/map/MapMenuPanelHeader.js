import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import React from 'react';

class MapMenuPanelHeader extends React.Component {

    render() {
        const { onPanelCollapseButtonClick } = this.props;

        return (
            <div className="map_menu_panel_header">
                <div className="left_part">
                    <div className="map_menu_panel_header_title">{this.props.children}</div>
                </div>
                <div className="right_part">
                    <div className="map_menu_panel_collapse_button" onClick={onPanelCollapseButtonClick} title="Свернуть панель меню">
                        <i className="icn_arrow_down_white"></i>
                    </div>
                </div>
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return {
        onPanelCollapseButtonClick: function() {
            dispatch(
                mapPageActionCreators.mainMenu.setActiveItemId(null)
            )
        },
    };
}

export default connect(null, mapDispatchToProps)(MapMenuPanelHeader);
