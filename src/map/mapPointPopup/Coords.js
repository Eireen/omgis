import { creators as mapPageActionCreators } from '../../actions/mapPage';
import Altitude from './Altitude';
import update from 'immutability-helper';
import React from 'react';
import { connect } from 'react-redux';
import { decimalDegreesToDMS } from '../../utils/gis';

class Coords extends React.Component {

    render() {
        const { pointDetails: { popup, coords } } = this.props;

        if (!popup.isVisible || !coords) return null;

        const latDirection = coords.latLng.lat >= 0 ? 'N' : 'S';
        const lngDirection = coords.latLng.lng >= 0 ? 'E' : 'W';

        const formattedLat = decimalDegreesToDMS(coords.latLng.lat);
        const formattedLng = decimalDegreesToDMS(coords.latLng.lng);

        return (
            <div className="map_point_coords">
                <div className="map_point_coords_values">
                    <div className="map_point_coords_values_item">
                        <label className="map_point_coords_label" dangerouslySetInnerHTML={{ __html: `${latDirection}:` }}></label>
                        <div className="map_point_coords_value" dangerouslySetInnerHTML={{ __html: formattedLat }}></div>
                    </div>
                    <div className="map_point_coords_values_item">
                        <label className="map_point_coords_label" dangerouslySetInnerHTML={{ __html: `${lngDirection}:` }}></label>
                        <div className="map_point_coords_value" dangerouslySetInnerHTML={{ __html: formattedLng }}></div>
                    </div>
                    <Altitude />
                </div>
                {/*<button type="button" className="map_point_coords_toggle">
                    Формат
                </button>*/}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        pointDetails: state.mapPage && state.mapPage.pointDetails,
    };
}

export default connect(mapStateToProps)(Coords);
