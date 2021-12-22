import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';

class BackButton extends React.Component {

    hideInfoPanel = () => {
        const { dispatch } = this.props;

        dispatch(
            mapPageActionCreators.layers.hideLayerInfoPanel()
        );
    }

    render() {
        return (
            <button type="button" className="map_menu_panel_header_fixed_button" onClick={this.hideInfoPanel}>
                &lt; Назад
            </button>
        );
    }
}

export default connect()(BackButton);
