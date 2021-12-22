import React from 'react';
import MapLayerFilterCalendarDateInputField from './MapLayerFilterCalendarDateInputField';

class MapLayerFilterCalendarDateInput extends React.Component {

    render() {
        return (
            <div className="map_filter_calendar_date_input">
                <i className="icn icn_calendar"></i>
                <MapLayerFilterCalendarDateInputField {...this.props} />
            </div>
        );
    }
}

export default MapLayerFilterCalendarDateInput;
