import React from 'react';
import { connect } from 'react-redux';
import ClosePopupButton from './ClosePopupButton';

class MapPointMarker extends React.Component {

    static get MARKER_WIDTH() {
        return 20;
    }

    static get MARKER_HEIGHT() {
        return 30;
    }

    render() {
        const { popup, coords } = this.props.pointDetails;

        if (!popup.isVisible || !coords) return null;

        const { pixel: { relative: pointPixelCoords } } = coords;

        const markerStyle = {
            top: pointPixelCoords.y - MapPointMarker.MARKER_HEIGHT,
            left: pointPixelCoords.x - (MapPointMarker.MARKER_WIDTH / 2),
        };

        return (
            <div className="map_point_marker" style={markerStyle}>
                <i className="icn icn_map_marker_navy"></i>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        pointDetails: state.mapPage && state.mapPage.pointDetails,
    };
}

export default connect(mapStateToProps)(MapPointMarker);
