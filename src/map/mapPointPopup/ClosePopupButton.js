import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';

class ClosePopupButton extends React.Component {

    onClick = () => {
        const { dispatch } = this.props;

        dispatch(
            mapPageActionCreators.pointDetails.hidePointDetails()
        );
    }

    render() {
        return (
            <button title="Закрыть" type="button" onClick={this.onClick} className="map_point_popup_close" dangerouslySetInnerHTML={{ __html:
                `<svg width="16" height="16">
                    <use xlink:href="#icn_close_cross"></use>
                </svg>`
            }}></button>
        );
    }
}

export default connect()(ClosePopupButton);
