import MapLayerFilterCalendarDateInput from './MapLayerFilterCalendarDateInput';
import MapLayerFilterCalendarPeriodInput from './MapLayerFilterCalendarPeriodInput';
import React from 'react';

class MapLayerFilterTemporalInput extends React.Component {

    getDefaultValue() {
        const { dbInputConfig } = this.props;

        if (!dbInputConfig.default_value_builder) return null;

        return eval(dbInputConfig.default_value_builder);
    }

    render() {
        const { dbInputConfig, value } = this.props;

        const TemporalComponent = dbInputConfig.is_period
            ? MapLayerFilterCalendarPeriodInput
            : MapLayerFilterCalendarDateInput;

        const resultProps = Object.assign({}, this.props, { value: value || this.getDefaultValue() });

        return (
            <TemporalComponent {...resultProps} />
        );
    }
}

export default MapLayerFilterTemporalInput;
