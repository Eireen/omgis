import api from '../api';
import { FirstChild, isObject, isScalar } from '../utils/common';
import classNames from 'classnames';
import DropdownItems from './DropdownItems';
import update from 'immutability-helper';
import $ from 'jquery';
import PropTypes from 'prop-types';
import React from 'react';
import TransitionGroup from 'react-transition-group/TransitionGroup';

/**
 * Фильтр с выбором единственной опции (выпадающий список, список радиокнопок)
 */
export default class AutocompletedSelect extends React.Component {

    state = {
        isOpen: false,
        inputValue: '',
        items: [],
    }

    componentWillReceiveProps(nextProps) {
        const currentProps = this.props;

        if (nextProps.value === currentProps.value) return;

        this.setInputValue(nextProps.valueLabel || '');
    }

    setInputValue(newValue) {
        this.setState(prevState => update(prevState, { inputValue: { $set: newValue } }));
    }

    retrieveSelectedItem(value) {
        if (value === null) return null;

        const { itemIdField } = this.props;
        const { items } = this.state;

        for (let item of items) {
            if (item[itemIdField] === value) return item;
        }
        return null;
    }

    getItemsForRender(items, value, selectedItem) {
        const {
            itemIdField,
            itemLabelField
        } = this.props;

        let result = items.map(item => {
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
            this.setState(prevState => update(prevState, { isOpen: { $set: false } }));
        }
    }

    isClickInside(event) {
        return !!this.baseNode && this.baseNode.contains(event.target);
    }

    onItemClick = arg => {
        this.setState(prevState => update(prevState, { isOpen: { $set: false } }));

        if (!this.props.onValueChange) return;

        const item = this.getItemById(arg.value);
        this.setInputValue(item.label);

        const valueChanged = arg.value !== this.props.value;
        valueChanged && this.props.onValueChange(Object.assign(arg, { valueLabel: item.label }));
    }

    getItemById(itemId) {
        const { items } = this.state;

        for (let item of items) {
            if (item.id === itemId) return item;
        }

        return null;
    }

    onInputChange = async event => {
        const { value } = event.target;

        this.setInputValue(value);

        if (value.length < (this.props.minInputLength || 3)) {
            this.setState(prevState => update(prevState, {
                isOpen: { $set: false },
                items: { $set: [] },
            }));
            return;
        }

        const { autocompleteUrl } = this.props;

        const searchResult = await api.get(autocompleteUrl, { query: value }, false, null, true);

        const newItems = searchResult.items && searchResult.items.length
            ? searchResult.items
            : [ { id: '', label: 'Ничего не найдено' } ];

        this.setState(prevState => update(prevState, {
            isOpen: { $set: true },
            items: { $set: newItems },
        }));
    }

    render() {
        const {
            classes,
            prompt,
            itemIdField,
            itemLabelField,
            defaultValue,
            label: filterLabel,
            disabled,
            brightDisabled
        } = this.props;

        const { items, inputValue, isOpen } = this.state;

        let { value } = this.props;
        if (value === null) {
            value = defaultValue;
        }

        const selectedItem = this.retrieveSelectedItem(value);

        const valueLabel = selectedItem === null
            ? prompt
            : (isScalar(selectedItem)
                ? selectedItem
                : selectedItem[itemLabelField] || '');

        const itemsForRender = this.getItemsForRender(items, value, selectedItem);

        const rootClasses = classNames(
            'select_box',
            { bright_disabled: brightDisabled },
            classes && classes.root || '',
        );
        const subRootClasses = classNames({
            page_filter: true,
            no_label: true,
            called: isOpen,
            disabled,
        }, classes.subRoot);

        return (
            <div className={rootClasses} ref={this.refBase}>
                <div className={subRootClasses}>
                    <div className="call no_expand_arrow">
                        <textarea className="current" value={inputValue} placeholder={prompt} onChange={this.onInputChange} rows="1"></textarea>
                    </div>
                    <TransitionGroup component={FirstChild}>
                        { isOpen &&
                            <DropdownItems items={itemsForRender} onItemClick={this.onItemClick} />
                        }
                    </TransitionGroup>
                </div>
            </div>
        );
    }
}

AutocompletedSelect.defaultProps = {
    classes: {},

    canBeEmpty: true, // TODO: Удалить, если не понадобится
    emptyItemValue: '',
    emptyItemLabel: '',

    defaultValue: 'all',
    items: [],
    itemIdField: 'id',
    itemLabelField: 'name',
    label: '',
    prompt: 'Все',
};
