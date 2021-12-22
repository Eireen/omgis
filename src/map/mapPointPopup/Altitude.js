import AltitudeApi from '../../AltitudeApi';
import { creators as mapPageActionCreators } from '../../actions/mapPage';
import cx from 'classnames';
import update from 'immutability-helper';
import React from 'react';
import { connect } from 'react-redux';

class Altitude extends React.Component {

    state = {
        processing: false,
    }

    componentDidMount() {
        this.mounted = true; // Fix warning "You called setState() on an unmounted component"

        this.retrieveAltitude();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate(prevProps) {
        if (JSON.stringify(prevProps.pointDetails.coords) === JSON.stringify(this.props.pointDetails.coords)) return;

        this.retrieveAltitude();
    }

    async retrieveAltitude() {
        const { pointDetails: { coords }, dispatch } = this.props;

        if (!coords) return;

        this.processingModeOn();

        const altitude = await AltitudeApi.getAltitudeForPoint(coords.latLng);

        const resultAltitude = !altitude || altitude.value === -9999 // point is not found
            ? null
            : altitude;

        dispatch(mapPageActionCreators.pointDetails.setPointAltitude(resultAltitude));

        this.processingModeOff();
    }

    processingModeOn() {
        if (!this.mounted) return;

        this.setState(prevState =>
            update(prevState, {
                processing: { $set: true }
            })
        );
    }

    processingModeOff() {
        if (!this.mounted) return;

        this.setState(prevState =>
            update(prevState, {
                processing: { $set: false }
            })
        );
    }

    refBase = node => {
        this.baseNode = node;
    }

    render() {
        const { pointDetails: { coords, altitude } } = this.props;
        const { processing } = this.state;

        if (!processing && (!coords || !altitude)) return null;

        const rootClasses = cx('map_point_coords_values_item', { with_loader: processing });

        return (
            <div className={rootClasses}>
                <label className="map_point_coords_label">H:</label>
                {processing
                    ? <i className="icn loader_small_slate"></i>
                    : <div className="map_point_coords_value">
                        {altitude.value}&nbsp;м&nbsp;
                        <abbr title="высота над уровнем моря">н.у.м.</abbr>
                    </div>
                }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        pointDetails: state.mapPage && state.mapPage.pointDetails,
    };
}

export default connect(mapStateToProps)(Altitude);
