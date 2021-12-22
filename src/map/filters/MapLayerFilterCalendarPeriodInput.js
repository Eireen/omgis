import React from 'react';
import MapLayerFilterCalendarDateInputField from './MapLayerFilterCalendarDateInputField';

class MapLayerFilterCalendarPeriodInput extends React.Component {

    onValueChange = changedDateKey => ({ value }) => {
        const { value: currentPeriod } = this.props;

        const newTimestamp = Math.round(Date.parse(value) / 1000);

        const newPeriod = Object.assign({}, currentPeriod, { [changedDateKey]: newTimestamp });

        // Если порядок дат при выборе не соблюдён - начальная дата больше конечной или наоборот - то меняем даты местами
        if (changedDateKey === 'startDatetime' && newTimestamp > currentPeriod.endDatetime) {
            newPeriod.startDatetime = currentPeriod.endDatetime;
            newPeriod.endDatetime = newTimestamp;
        } else if (changedDateKey === 'endDatetime' && newTimestamp < currentPeriod.startDatetime) {
            newPeriod.startDatetime = newTimestamp;
            newPeriod.endDatetime = currentPeriod.startDatetime;
        }

        this.props.onValueChange({ value: newPeriod });
    }

    getMinMaxDates() {
        // Конвертирует настройки с сервера (min_date и max_date) в props для datepicker-а ({ minDate, maxDate })
        // Настройки с сервера (строковые) могут содержать либо timestamp, либо JS-код, возвращающий timestamp

        const { dbInputConfig } = this.props;

        const result = {};

        for (let extremumStr of ['min', 'max']) {
            const key = `${extremumStr}_date`;
            const src = dbInputConfig[key];
            if (!src) continue;
            let timestamp;
            if (/^\d+$/.test(src)) {
                // timestamp string
                timestamp = parseInt(src);
            } else {
                // JS script
                // TODO: add try-catch in case of invalid script
                timestamp = eval(src);
            }
            result[`${extremumStr}Date`] = new Date(timestamp * 1000);
        }

        return result;
    }

    render() {
        const { dbInputConfig, value } = this.props;

        const startValue = value && value.startDatetime || null;
        const endValue = value && value.endDatetime || null;

        const minMaxDates = this.getMinMaxDates();
        if (dbInputConfig.min_period_duration) {
            // TODO: учитывать допустимую длительность периода - min/min_period_duration
        }

        const startInputProps = Object.assign({}, this.props, {
            value: startValue,
            onValueChange: this.onValueChange('startDatetime'),
            ...minMaxDates,
        });
        const endInputProps = Object.assign({}, this.props, {
            value: endValue,
            onValueChange: this.onValueChange('endDatetime'),
        });

        return (
            <div className="map_filter_calendar_period_input">
                {/* <i className="icn icn_calendar"></i> */}
                <MapLayerFilterCalendarDateInputField {...startInputProps} />
                <div className="map_filter_calendar_period_divider">&mdash;</div>
                <MapLayerFilterCalendarDateInputField {...endInputProps} />
            </div>
        );
    }
}

export default MapLayerFilterCalendarPeriodInput;
