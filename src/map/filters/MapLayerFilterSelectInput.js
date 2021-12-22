import React from 'react';
import { connect } from 'react-redux';
import Select from '../../filters/Select';
import api from '../../api';

class MapLayerFilterSelectInput extends React.Component {

    state = {
        options: null,
    }

    async componentDidMount() {
        this.setState({
            options: await this.getItemsData(),
        });
    }

    async getItemsData() {
        const { dbInputConfig, filtersByLayerId } = this.props;
        const optionsSrc = dbInputConfig.options;

        // Если строка начинается с [ или {"", то считаем JSON-ом
        const isStaticJSON = /^\s*(?:\[|\{\s*"\S*")/.test(optionsSrc);
        if (isStaticJSON) {
            return optionsSrc;
        }

        const isUrl = /^https*:\/\//.test(optionsSrc);
        if (isUrl) {
            return await api.get(optionsSrc, { filtersByLayerId }, false, null, true);
        }

        // JS-код
        return (function(filtersByLayerId) {
            return eval(optionsSrc);
        })(filtersByLayerId);
    }

    getDefaultValue() {
        const { dbInputConfig } = this.props;

        if (!dbInputConfig.default_value_builder) return '';

        return eval(dbInputConfig.default_value_builder);
    }

    render() {
        const { dbInputConfig, value = null, required, onValueChange } = this.props;
        const { options } = this.state;

        if (!options) return null;

        const selectProps = Object.assign({
            // baseClasses: '',

            canBeEmpty: !required,
            emptyItemValue: '',
            emptyItemLabel: 'Сбросить выбор',

            defaultValue: this.getDefaultValue(),
            // filter: [],
            itemIdField: 'value',
            itemLabelField: 'label',
            prompt: '&nbsp;',
            // viewTemplate: null

            label: '',
            items: [],
            value,
            classes: { root: 'map_filter_select_root' },
            onItemClick: onValueChange,
        }, options);

        return (
            <Select {...selectProps} />
        );
    }
}

function mapStateToProps(state) {
    return {
        filtersByLayerId: state.mapPage.filter.filtersByLayerId,
    };
}

export default connect(mapStateToProps)(MapLayerFilterSelectInput);
