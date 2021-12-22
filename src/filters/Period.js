import { clone } from '../utils/common';
import { formatFromYmd, timestamp } from '../utils/date';
import { strIndexOf } from '../utils/array';
import $ from 'jquery';
import date from 'locutus/php/datetime/date';
import pickmeup from '../vendor/jquery.pickmeup/jquery.pickmeup.min';
import pickmeupCss from '../vendor/jquery.pickmeup/pickmeup.min.css';
import PropTypes from 'prop-types';
import React from 'react';
import Select from './Select';
import store from '../utils/store';
import strtotime from 'locutus/php/datetime/strtotime';

export default class Period extends React.Component {

    partParams = ['startDate', 'endDate']

    dateRegex = /^\d{4}-\d{2}-\d{2}$/

    customOptionId = 'custom'

    initDatepicker(node) {
        var datepickerSettings = {
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
                change: function(date) { /* В случае выбора диапазона дат передаётся массив */
                    var filterItem = this;

                    /* `pmu-mode` must be set to 'range' */

                    var startDate = date[0],
                        endDate = date[1];

                    /* При выборе диапазона сначала (после выбора первой даты) передается массив
                    из 2-х одинаковых дат, затем собственно диапазон - первую дату запомним
                    в data-start-date и подождем выбора 2-й */
                    if (!filterItem.dataset.startDate) {
                        filterItem.dataset.startDate = startDate;
                        return;
                    }

                    filterItem.dataset.startDate = '';

                    if (!startDate || !endDate) return;

                    var newValue = { startDate: startDate, endDate: endDate };
                    filterItem.dataset.value = JSON.stringify(newValue);

                    this.dispatchEvent(new CustomEvent('periodPick', {
                        bubbles: false
                    }));
                },
                // Toggling panel
                show: function() {
                    if (+this.dataset.visible) {
                        this.dataset.visible = 0;
                        $(this).pickmeup('hide');
                        return false;
                    } else {
                        this.dataset.visible = 1;
                        return true;
                    }
                },
                hide: function() {
                    this.dataset.visible = 0;
                }
            };

        $(node).pickmeup(datepickerSettings);
    }

    getDefaultItems() {
        const startYear = +store.get('periodFilterStartYear');
        const currentYear = new Date().getFullYear();

        const lastMondayTimestamp = strtotime('last monday', timestamp(new Date())); // http://stackoverflow.com/a/36110061/1780443

        const items = [
            {
                'label': 'За неделю',
                'id': JSON.stringify({
                    'startDate': date('Y-m-d', lastMondayTimestamp),
                    'endDate': date('Y-m-d')
                })
            },
            {
                'label': 'За текущий месяц',
                'id': JSON.stringify({
                    'startDate': date('Y-m-01'),
                    'endDate': date('Y-m-d')
                })
            },
            {
                'label': currentYear,
                'id': JSON.stringify({
                    'startDate': date('Y-01-01'),
                    'endDate': date('Y-m-d')
                })
            }
        ];

        for (let year = currentYear - 1; year >= startYear; year--) {
            items.push({
                'label': year,
                'id': JSON.stringify({
                    'startDate': `${year}-01-01`,
                    'endDate': `${year}-12-31`
                })
            });
        }

        items.push({
            'label': 'Произвольный',
            'id': this.customOptionId
        });

        return items;
    }

    retrieveValueFromFilter() {
        const { filter } = this.props;

        /* Составляем значение из `startDate` и/или `endDate` */

        const result = {};

        for (let partParam of this.partParams) {
            if (filter[partParam] && this.dateRegex.test(filter[partParam])) {
                result[partParam] = filter[partParam];
            }
        }

        return Object.keys(result).length
            ? JSON.stringify(result)
            : null;
    }

    commonRetrieveSelectedItem(items, value) { // копипаста из Select.retrieveSelectedItem() (с заменой `items` на внешний параметр)
        if (value === null) return null;

        const {
            itemIdField,
            filter,
            param
        } = this.props;

        // Сначала считаем, что все элементы - объекты
        const itemIds = items.map(item => item[itemIdField]);
        let index = strIndexOf(itemIds, value);
        if (!~index) {
            // Пробуем искать по элементам как по скалярным значениям
            index = strIndexOf(items, value);
        }
        return ~index ? items[index] : null;
    }

    filterHasValidDates() {
        const { filter } = this.props;

        for (let partParam of this.partParams) {
            if (this.isValidDate(filter[partParam])) return true;
        }

        return false;
    }

    isValidDate(str) {
        return !!str && this.dateRegex.test(str);
    }

    /* Подгоняет id и метку опции "Произвольный" под текущий выбранный период */
    modifyCustomOption(items, value, changeLabel = false) {
        const {
            itemIdField,
            itemLabelField
        } = this.props;

        const customOption = items.find(item => item[itemIdField] === this.customOptionId);
        if (!customOption) return;

        if (changeLabel) {
            customOption[itemIdField] = value;
            customOption[itemLabelField] = this.getCustomOptionLabel();
        }

        customOption.hasDatepicker = true; // признак кастомной опции (на id === custom нельзя ориентироваться - перезаписывается)
        customOption.refHandler = this.refCustomOption;
        customOption.customEventHandlers = {
            periodPick: this.onPeriodPick
        };
    }

    getCustomOptionLabel() {
        const { filter } = this.props;
        let startDateStr = '', endDateStr = '';
        const formatter = new Intl.DateTimeFormat('ru');

        if (this.isValidDate(filter.startDate)) {
            startDateStr = formatter.format(Date.parse(filter.startDate));
        }

        if (this.isValidDate(filter.endDate)) {
            endDateStr = formatter.format(Date.parse(filter.endDate));
        }

        let result;

        if (startDateStr && endDateStr) {
            result = `${startDateStr} — ${endDateStr}`;
        } else if (!startDateStr && endDateStr) {
            result = `До ${endDateStr}`;
        } else if (startDateStr && !endDateStr) {
            result = `После ${startDateStr}`;
        } else {
            result = 'Произвольный';
        }

        return result;
    }

    refCustomOption = node => {
        if (node) {
            this.initDatepicker(node);
        } else if (this.customOptionNode) {
            $(this.customOptionNode).pickmeup('destroy');
        }
        this.customOptionNode = node;
    }

    onPeriodPick = event => {
        const { onPeriodPick } = this.props;
        if (onPeriodPick) onPeriodPick(event);
    }

    render() {
        const items = this.props.items && this.props.items.length
            ? clone(this.props.items)
            : this.getDefaultItems();

        const value = this.retrieveValueFromFilter();

        let changeCustomLabel = false;
        if (value !== null) {
            const selectedItem = this.commonRetrieveSelectedItem(items, value);
            if (selectedItem === null && this.filterHasValidDates()) {
                changeCustomLabel = true;
            }
        }

        this.modifyCustomOption(items, value, changeCustomLabel); // сюда передаем копию входящих items, поэтому модификация допустима

        const props = Object.assign({
            param: 'period',
            prompt: 'Всего',
            itemLabelField: 'label',
            viewTemplate: 'radioList'
        }, this.props, {
            items,
            value
        });

        return (
            <Select {...props} />
        );
    }
}

Period.defaultProps = {
    filter: [],
    items: [],
    itemIdField: 'id',
    itemLabelField: 'label'
};
