import { formatYmd } from '../utils/date';
import $ from 'jquery';
import pickmeup from '../vendor/jquery.pickmeup/jquery.pickmeup.min';
import pickmeupCss from '../vendor/jquery.pickmeup/pickmeup.min.css';
import PropTypes from 'prop-types';
import React from 'react';

export default class DatePicker extends React.Component {

    defaultParam = 'date'

    dateRegex = /^\d{4}-\d{2}-\d{2}$/

    state = {
        isDatepickerVisible: false
    }

    componentDidMount() {
        const { node } = this;
        const { onDatePick } = this.props;

        if (node) {
            this.initDatepicker(node);
            if (onDatePick) {
                node.addEventListener('periodPick', onDatePick);
            }
        }
    }

    initDatepicker(node) {
        const component = this;

        const datepickerSettings = {
                format: 'Y-m-d',
                hide_on_select: true,
                first_day: 1,
                select_month: true,
                select_year: true,
                position: window.innerWidth > 825 ? 'left' : 'bottom',
                locale: {
                    days:        ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
                    daysShort:   ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    daysMin:     ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    months:      ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                    monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
                },
                change: function(date) {
                    var filterItem = this;

                    filterItem.dataset.value = date;

                    this.dispatchEvent(new CustomEvent('periodPick', {
                        bubbles: false
                    }));
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

        datepickerSettings.date = this.retrieveValue();

        $(node).pickmeup(datepickerSettings);
    }

    retrieveValue() {
        const { required, defaultValue } = this.props;

        let value = this.retrieveValueFromFilter();
        if (!value && required) {
            value = defaultValue || formatYmd(new Date());
        }

        return value;
    }

    retrieveValueFromFilter() {
        const { filter } = this.props;

        return filter.date && this.dateRegex.test(filter.date)
            ? filter.date
            : null;
    }

    isValidDate(str) {
        return !!str && this.dateRegex.test(str);
    }

    formatDate(date) {
        const formatter = new Intl.DateTimeFormat('ru');
        return formatter.format(Date.parse(date));
    }

    refBase = node => {
        this.node = node;

        const { refHandler } = this.props;
        if (refHandler) refHandler(node);
    }

    render() {
        const { required } = this.props;

        const value = this.retrieveValue();

        const label = value
            ? this.formatDate(value)
            : 'Дата';
        
        const props = {
            'data-has-datepicker': true,
            'data-pmu-mode': 'single',
            'data-visible': this.state.isDatepickerVisible ? true : '',
            'data-value': value,
            ref: this.refBase
        };

        return (
            <a href="javascript:" className="filter_period" {...props}>
                <i className="icn icn_calendar"></i>
                <span>Дата</span>
                <div className="current" dangerouslySetInnerHTML={{ __html: label }}></div>
            </a>
        );
    }
}

DatePicker.defaultProps = {
    filter: [],
    itemIdField: 'id',
    itemLabelField: 'label'
};
