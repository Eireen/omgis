import { FirstChild, isObject, isScalar } from '../utils/common';
import { strIndexOf } from '../utils/array';
import $ from 'jquery';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import TransitionGroup from 'react-transition-group/TransitionGroup';
import DropdownItems from './DropdownItems';

/**
 * Фильтр с выбором единственной опции (выпадающий список, список радиокнопок)
 */
export default class Select extends React.Component {

    state = {
        isOpened: false
    }

    retrieveValue() {
        let { canBeEmpty, value, defaultValue } = this.props;
        if (!~[null, undefined].indexOf(value)) return value;

        value = this.retrieveValueFromFilter();
        if (value === null && !canBeEmpty) {
            value = !~[null, undefined].indexOf(defaultValue)
                ? defaultValue
                : this.retrieveValueFromFirstItem();
        }
        return value;
    }

    retrieveValueFromFilter() {
        const { filter, param } = this.props;
        return filter[param] !== undefined
            ? filter[param]
            : null;
    }

    retrieveValueFromFirstItem() {
        const { items, itemIdField } = this.props;
        let value = null;
        if (items[0] && items[0][itemIdField]) { // Сначала пробуем обратиться к первому элементу как к объекту
            value = items[0][itemIdField];
        } else if (items[0] !== undefined && isScalar(items[0])) {
            value = items[0]; // Берем скалярное значение
        }
        return value;
    }

    retrieveSelectedItem(value) {
        if (value === null) return null;

        const {
            items,
            itemIdField
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

    getItemsForRender(items, value, selectedItem) {
        const {
            canBeEmpty,
            itemIdField,
            itemLabelField
        } = this.props;

        const resultItems = canBeEmpty
            ? this.addEmptyItem(items)
            : items;

        let result = resultItems.map(item => {
            const id = isScalar(item) ? item : item[itemIdField];
            const isSelected = selectedItem !== null
                ? selectedItem === item
                : value + '' === id + '';
            const result = {
                id,
                label: isScalar(item) ? item : item[itemLabelField],
                /* При наличии нескольких опций с одинаковым `id` помечаем выбранным
                    только первый вариант (записанный в selectedItem) */
                isSelected,
                refHandler: item.refHandler,
                customEventHandlers: item.customEventHandlers
            };
            /* item из конфига может содержать произвольные поля - их тоже переносим
            в объект для view, чтобы не заморачиваться с белым списком */
            if (isObject(item)) {
                for (let key in item) {
                    if (result[key] === undefined) {
                        result[key] = item[key];
                    }
                }
            }
            return result;
        });

        return result;
    }

    addEmptyItem(items) {
        const {
            itemIdField,
            itemLabelField,
            emptyItemValue,
            emptyItemLabel,
            prompt,
        } = this.props;

        const resultItems = items.slice();
        resultItems.unshift({
            [itemIdField]: emptyItemValue || '',
            [itemLabelField]: emptyItemLabel === undefined
                ? prompt
                : (emptyItemLabel === null
                    ? ''
                    : emptyItemLabel),
        });
        return resultItems;
    }

    refBase = node => {
        this.baseNode = node;
        if (this.props.refSelectbox) {
            this.props.refSelectbox(node);
        }
    }

    componentDidMount() {
        this.addOutsideClickHandler();
    }

    componentWillUnmount() {
        if (this.baseNode && this.props.refSelectbox) {
            this.props.removeRefSelectbox(this.baseNode);
        }

        this.removeOutsideClickHandler();
    }

    addOutsideClickHandler() {
        document.body.addEventListener('click', this.onDocumentClick);
    }

    removeOutsideClickHandler() {
        document.body.removeEventListener('click', this.onDocumentClick);
    }

    onDocumentClick = event => {
        if (!this.isClickInside(event)) {
            this.setState({ isOpened: false });
        }
    }

    isClickInside(event) {
        return !!this.baseNode && this.baseNode.contains(event.target);
    }

    onSelectionClick = event => {
        event.preventDefault();

        const { disabled, brightDisabled } = this.props;

        if (disabled || brightDisabled) return;

        this.setState(prevState => ({
            isOpened: !prevState.isOpened
        }));
    }

    onItemClick = arg => {
        this.setState({ isOpened: false });

        if (!this.props.onItemClick) return;

        // TODO: с условием `valueChanged` название `onItemClick` надо бы сменить на `onValueChange`
        // (раньше `onItemClick` вызывался всегда, даже если кликали по уже выбранному элементу)
        const valueChanged = arg.value !== this.props.value;
        valueChanged && this.props.onItemClick(arg);
    }

    render() {
        const {
            baseClasses,
            prompt,
            itemIdField,
            itemLabelField,
            defaultValue,
            label: filterLabel,
            items,
            param,
            viewTemplate,
            dependants,
            disabled,
            classes,
            brightDisabled,
        } = this.props;

        const { isOpened } = this.state;

        // Достаем выбранный id - либо явно заданный из props, либо дефолтный из items
        let value = !~[null, undefined].indexOf(this.props.value)
            ? this.props.value
            : this.retrieveValue();

        const selectedItem = this.retrieveSelectedItem(value);

        const valueLabel = selectedItem === null
            ? prompt
            : (isScalar(selectedItem)
                ? selectedItem
                : selectedItem[itemLabelField] || '');

        if (value === null) {
            value = defaultValue;
        }

        const viewComponentsByNames = { 'radioList': RadioList };
        const ViewComponent = viewTemplate && viewComponentsByNames[viewTemplate]
            ? viewComponentsByNames[viewTemplate]
            : (filterLabel
                ? LabeledDropdown
                : Dropdown);

        const props = {
            items: this.getItemsForRender(items, value, selectedItem),
            baseClasses,
            filterLabel,
            param,
            valueLabel,
            isOpened,
            onSelectionClick: this.onSelectionClick,
            onItemClick: this.onItemClick,
            refBase: this.refBase,
            dependants,
            disabled,
            brightDisabled,
            classes,
        };

        return (
            <ViewComponent {...props} />
        );
    }
}

const Dropdown = ({
    baseClasses,
    items,
    param,
    valueLabel,
    isOpened = false,
    onSelectionClick,
    refBase,
    onItemClick,
    dependants,
    disabled,
    brightDisabled,
    classes
}) => {
    const rootClasses = classNames(
        'select_box',
        { bright_disabled: brightDisabled },
        classes && classes.root || ''
    );
    const subRootClasses = classNames({
        page_filter: true,
        no_label: true,
        called: isOpened,
        disabled,
    }, baseClasses);
    return (
        <div className={rootClasses} ref={refBase}>
            <div className={subRootClasses} data-name={param} data-dependants={dependants}>
                <div className="call" onClick={onSelectionClick}>
                    <span>
                        <div className="current_wrap">
                            <span className="current" dangerouslySetInnerHTML={{__html: valueLabel}}></span>
                            {!brightDisabled &&
                                <i className="icn icn_select"></i>
                            }
                        </div>
                    </span>
                </div>
                <TransitionGroup component={FirstChild}>
                    <DropdownItems {...{ param, items, isOpened, onItemClick }} />
                </TransitionGroup>
            </div>
        </div>
    );
}

class LabeledDropdown extends React.Component {

    minSelectWidth = 310 // иначе селект открывается слишком узким при изначально короткой метке

    componentWillReceiveProps(nextProps) {
        // При раскрытии селекта с меткой нужно фиксировать ширину - иначе будет прыгать на ширину метки
        if (!this.props.isOpened && nextProps.isOpened && this.selectionNode) {
            this.width = Math.max(this.selectionNode.clientWidth, this.minSelectWidth);
        }
    }

    refSelection = node => {
        this.selectionNode = node;
    }

    render() {
        const {
            baseClasses,
            filterLabel,
            items,
            param,
            valueLabel,
            isOpened = false,
            onSelectionClick,
            refBase,
            onItemClick,
            dependants,
            disabled,
        } = this.props;

        const classes = classNames({
            page_filter: true,
            labeled: true,
            called: isOpened,
            disabled,
        }, baseClasses);

        const style = {
            width: isOpened ? `${this.width}px` : 'auto'
        };

        return (
            <div className={classes} data-name={param} style={style} ref={refBase} data-dependants={dependants}>
                <div className="call" onClick={onSelectionClick} ref={this.refSelection}>
                    <span className="label" dangerouslySetInnerHTML={{__html: filterLabel}}></span>
                    <span>
                        <div className="current_wrap">
                            <span className="current" dangerouslySetInnerHTML={{__html: valueLabel}}></span>
                            <i className="icn icn_select"></i>
                        </div>
                    </span>
                </div>
                <TransitionGroup component={FirstChild}>
                    { isOpened &&
                        <DropdownItems {...{ param, items, onItemClick }} />
                    }
                </TransitionGroup>
            </div>
        );
    }
}

class RadioList extends React.Component {

    onItemClick = ({ event, value }) => {
        if (!this.props.onItemClick) return;

        const { param: name } = this.props;

        this.props.onItemClick({ event, name, value });
    }

    render() {
        const {
            items,
            param,
            filterLabel,
        } = this.props;

        return (
            <div>
                { filterLabel &&
                    <span className="radio_filter_label" dangerouslySetInnerHTML={{__html: filterLabel}}></span>
                }
                <ul data-filter="true" data-type="radio" data-name={param}>
                    {items.map(item => <RadioListItem {...item} key={`${item.id}_${item.label}`} onClick={this.onItemClick} />)}
                    {/* NOTE: в ключ добавлена метка, т.к. id могут сопадать - например, кнопки в "Периоде" могут задавать один и тот же период (в январе периоды "За месяц" и "За год" будут совпадать) */}
                </ul>
            </div>
        );
    }
}

class RadioListItem extends React.Component {

    componentDidMount() {
        const { customEventHandlers } = this.props;
        if (customEventHandlers && this.node) {
            for (let eventName in customEventHandlers) {
                this.node.addEventListener(eventName, customEventHandlers[eventName]);
            }
        }
    }

    onClick = event => {
        if (this.props.onClick) {
            this.props.onClick({
                event,
                value: this.props.id
            });
        }
    }

    refBase = node => {
        this.node = node;

        const { refHandler } = this.props;
        if (refHandler) refHandler(node);
    }

    render() {
        const {
            disabled,
            label,
            id,
            classes,
            isSelected,
            hasDatepicker,
            defaultUrlParams,
        } = this.props;

        if (disabled) {
            return (
                <li className="disabled" dangerouslySetInnerHTML={{__html: label}}></li>
            );
        }

        const isCustomPeriodOption = !!hasDatepicker;
        const link = <a href="javascript:" dangerouslySetInnerHTML={{__html: label}}></a>;
        const props = {
            'data-value': id,
            className: classNames(...(classes || []), {
                'selected': isSelected
            }),
            onClick: this.onClick
        };
        if (defaultUrlParams) {
            /* Установка дефолтных значений других фильтров при смене какого-то фильтра
            (например, поставить дефолтный период при выборе "Типа отчёта") */
            props['data-default-url-params'] = JSON.stringify(defaultUrlParams);
        }
        if (isCustomPeriodOption) {
            Object.assign(props, {
                'data-has-datepicker': true,
                'data-pmu-mode': 'range',
                ref: this.refBase
            });
        }
        return (
            <li {...props}>{link}</li>
        );
    }
}

Select.defaultProps = {
    baseClasses: '',

    canBeEmpty: true,
    emptyItemValue: '',
    emptyItemLabel: '',

    defaultValue: 'all',
    filter: [],
    items: [],
    itemIdField: 'id',
    itemLabelField: 'name',
    label: '',
    prompt: 'Все',
    viewTemplate: null
};
