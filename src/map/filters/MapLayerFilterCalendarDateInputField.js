import $ from 'jquery';
import pickmeup from '../../vendor/jquery.pickmeup/jquery.pickmeup.min';
import pickmeupCss from '../../vendor/jquery.pickmeup/pickmeup.min.css';
import React from 'react';
import { connect } from 'react-redux';

class MapLayerFilterCalendarDateInputField extends React.Component {

    rootNode = null

    componentDidMount() {
        const { rootNode } = this;
        const { onDatePick } = this.props;

        rootNode && this.initDefaultDatepicker();
    }

    componentWilUnmount() {
        $(this.rootNode).pickmeup('destroy');
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            this.refreshDatepicker({ date: this.getTimestampAsDateObj(nextProps.value) });
        }
    }

    initDefaultDatepicker() {
        this.initDatepicker(this.getDefaultDatepickerSettings());
    }

    initDatepicker(datepickerSettings) {
        $(this.rootNode).pickmeup(datepickerSettings);
    }

    getDefaultDatepickerSettings(node) {
        const { value, minDate, maxDate, onValueChange } = this.props;
        const component = this;

        return {
            date: this.getTimestampAsDateObj(value),
            format: 'Y-m-d',
            hide_on_select: true,
            first_day: 1,
            select_month: true,
            select_year: true,
            position: 'bottom',
            locale: {
                days:        ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
                daysShort:   ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                daysMin:     ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                months:      ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            },
            min: minDate,
            max: maxDate,
            change: function(date) {
                onValueChange({ value: date });
            }/*,
            // Toggling panel (TODO: не работает)
            show: function() {
                if (this.dataset.visible) {
                    component.setState({ isDatepickerVisible: false });
                    $(this).pickmeup('hide');
                    return false;
                } else {
                    component.setState({ isDatepickerVisible: true });
                    return true;
                }
            },
            hide: function() {
                component.setState({ isDatepickerVisible: false });
            }*/
        };
    }

    refreshDatepicker(newOptions) {
        $(this.rootNode).pickmeup('destroy');

        const datepickerSettings = Object.assign(this.getDefaultDatepickerSettings(), newOptions);
        this.initDatepicker(datepickerSettings);
    }

    getTimestampAsDateObj(timestamp) {
        return new Date(timestamp ? timestamp * 1000 : undefined);
    }

    formatDateFromTimestamp(date) {
        const formatter = new Intl.DateTimeFormat('ru');
        return formatter.format(new Date(date * 1000));
    }

    refBase = node => {
        this.rootNode = node;
    }

    render() {
        const { dbInputConfig, onValueChange } = this.props;
        let { value } = this.props;

        const label = value
            ? this.formatDateFromTimestamp(value)
            : '';

        return (
            <div className="map_filter_calendar_date_input_value" dangerouslySetInnerHTML={{ __html: label }} ref={this.refBase}></div>
        );
    }
}

function mapStateToProps(state) {
    return {};
}

export default connect(mapStateToProps)(MapLayerFilterCalendarDateInputField);
