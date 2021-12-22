import { creators as cacheActionCreators } from '../../actions/cache';
import { creators as mapPageActionCreators } from '../../actions/mapPage';
import { clone } from '../../utils/common';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import MapLayerFilterOperatorSelect from './MapLayerFilterOperatorSelect';
import MapLayerFilterSelect from './MapLayerFilterSelect';
import MapLayerFilterInput from './MapLayerFilterInput';
import React from 'react';

/* Фильтр слоя */
class MapLayerFilter extends React.Component {

    state = {
        localInputValue: null,
    }

    componentDidMount() {
        this.setSingleFilterAsDefault();

        this.initLocalInputValue();
    }

    initLocalInputValue() {
        const { filterState } = this.props;

        this.setLocalInputValue(filterState.value);
    }

    setSingleFilterAsDefault() {
        // Если к слою привязан один фильтр, то сразу поставить его в селекте фильтра

        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            layersById, dispatch,
        } = this.props;

        const layerFilters = layersById[layerId].filters;

        if (layerFilters.length !== 1) return;

        const filterId = layerFilters[0].id;
        const filter = this.getLayerFilterConfig(filterId);
        const operatorId = filter.default_comparison_operator || filter.operators[0];

        const newFilterState = Object.assign({}, filterState, { filterId, operatorId });

        dispatch(
            mapPageActionCreators.filters.setSandboxFilters({
                layerId,
                filterConfigs: [ { filterGroupIndex: orGroupIndex, filterIndex: andGroupIndex, filterState: newFilterState } ],
            })
        );
    }

    getLayerFilterConfig(filterId) {
        const { layerId, layersById } = this.props;

        const layerFiltersConfig = layersById[layerId].filters;
        // if (!layerFiltersConfig || !layerFiltersConfig.length) return null;

        for (let filter of layerFiltersConfig) {
            if (filter.id === filterId) {
                return filter;
            }
        }

        return null;
    }

    getOperatorConfig(operatorId) {
        const { filterState: { filterId } } = this.props;

        const filter = this.getLayerFilterConfig(filterId);

        for (let op of filter.operators) {
            if (op.operatorId === operatorId) {
                return op;
            }
        }

        return null;
    }

    getDefaultOperatorConfig(filterId) {
        const filter = this.getLayerFilterConfig(filterId);

        const defaultOpId = filter.default_comparison_operator;
        if (defaultOpId) {
            for (let op of filter.operators) {
                if (op.operatorId === defaultOpId) {
                    return op;
                }
            }
        }
        return filter.operators[0];
    }

    clearLocalInputValue() {
        this.setLocalInputValue(null);
    }

    setLocalInputValue(newValue) {
        this.setState(prevState => update(prevState, { localInputValue: { $set: newValue } }));
    }

    onFilterSelectItemClick = ({ value }) => {
        const filterId = value ? +value : null;

        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            layersById, dispatch,
        } = this.props;

        const newFilterState = Object.assign({}, filterState, { filterId });

        // если filterId сменился - найти и поставить дефолтный operatorId
        if (newFilterState.filterId !== filterState.filterId) {
            if (filterId === null) {
                newFilterState.operatorId = null;
            } else {
                const defaultOpConfig = this.getDefaultOperatorConfig(filterId);
                for (let prop of ['operatorId']) {
                    newFilterState[prop] = defaultOpConfig[prop];
                }
            }
        }

        dispatch(
            mapPageActionCreators.filters.setSandboxFilters({
                layerId,
                filterConfigs: [ { filterGroupIndex: orGroupIndex, filterIndex: andGroupIndex, filterState: newFilterState } ],
            })
        );

        this.clearLocalInputValue();
    }

    onOperatorSelectItemClick = ({ value: operatorId }) => {
        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            layersById, dispatch,
        } = this.props;

        const newFilterState = Object.assign({}, filterState, { operatorId, value: null });

        dispatch(
            mapPageActionCreators.filters.setSandboxFilters({
                layerId,
                filterConfigs: [ { filterGroupIndex: orGroupIndex, filterIndex: andGroupIndex, filterState: newFilterState } ],
            })
        );

        this.clearLocalInputValue();
    }

    onRemoveFilterButtonClick = () => {
        const {
            layerId, orGroupIndex, andGroupIndex, dispatch,
        } = this.props;

        dispatch(
            mapPageActionCreators.filters.removeFilter({
                layerId,
                orGroupIndex, andGroupIndex,
            })
        );
    }

    onClearInputButtonClick = () => {
        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            dispatch,
        } = this.props;

        const newFilterState = Object.assign({}, filterState, { value: null });

        // Для селектов очищаем сразу и "прод"-, и "песочный" фильтры, а для остальных (которые срабатывают по нажатию "Применить") - только песочный
        const operatorConfig = this.getOperatorConfig(filterState.operatorId);
        const actionCreator = operatorConfig.inputTypeId === 'select'
                ? 'setFilters'
                : 'setSandboxFilters';

        dispatch(
            mapPageActionCreators.filters[actionCreator]({
                layerId,
                filterConfigs: [ { filterGroupIndex: orGroupIndex, filterIndex: andGroupIndex, filterState: newFilterState } ],
            })
        );

        this.clearLocalInputValue();
    }

    onAppliedValueChange = ({ value: newValue, valueLabel: newValueLabel }) => {
        // Обработчик изменений инпутов, значение которых можно применить сразу при любом событии onChange (селекты)

        this.applyInputValue(newValue, newValueLabel);

        this.setLocalInputValue(newValue);
    }

    onLocalInputValueChange = arg => {
        // Обработчик изменений инпутов, значение которых применяется не сразу, а только после нажатия соотв. кнопки
        // (текстовые поля)

        // `arg` может быть либо event-ом с target (стандартные инпуты), либо простым объектом с `value` (date picker)
        const { value } = arg && arg.target || arg;

        this.setLocalInputValue(value);
    }

    onApplyButtonClick = () => {
        const { localInputValue: newValue } = this.state;

        this.applyInputValue(newValue);
    }

    applyInputValue(newValue, newValueLabel) {
        // Записывает значение инпута в глобальный стор

        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            layersById, dispatch,
        } = this.props;

        const newFilterState = Object.assign({}, filterState, { value: newValue });

        dispatch(
            mapPageActionCreators.filters.setSandboxFilters({
                layerId,
                filterConfigs: [ { filterGroupIndex: orGroupIndex, filterIndex: andGroupIndex, filterState: newFilterState } ],
            })
        );

        // Переносим из `sandboxFilter` в активный `filter` фильтры с непустыми значениями
        this.updateActiveFilter({ orGroupIndex, andGroupIndex, newFilterState });

        dispatch(cacheActionCreators.setCacheItems([{
            key: `map_layer_${layerId}_filter_${filterState.filterId}_${newValue}`, value: newValueLabel,
        }]));
    }

    updateActiveFilter(editedFilterState) {
        // Переносим из `sandboxFilter` в активный `filter` фильтры с непустыми значениями

        const { layerId, sandboxFiltersByLayerId, dispatch } = this.props;

        // Сначала обновляем значение в sandbox-фильтре
        const sandboxFiltersEdited = clone(sandboxFiltersByLayerId);
        const { orGroupIndex, andGroupIndex, newFilterState } = editedFilterState;
        sandboxFiltersEdited[layerId][orGroupIndex][andGroupIndex] = newFilterState;

        dispatch(
            mapPageActionCreators.filters.applyFilters({ // установка активного фильтра целиком
                filtersByLayerId: this.getNonEmptyFilters(sandboxFiltersEdited),
            })
        );
    }

    getNonEmptyFilters(filtersByLayerId) {
        // Отбираем из sandboxFilter фильтры с непустыми значениями

        const result = {};

        for (let layerId in filtersByLayerId) {
            const orGroups = filtersByLayerId[layerId];
            result[layerId] = [];
            for (let orGroup of orGroups) {
                const cleanOrGroup = [];
                for (let filterState of orGroup) {
                    if (filterState.value !== null) {
                        cleanOrGroup.push(filterState);
                    }
                }
                if (cleanOrGroup.length) {
                    result[layerId].push(cleanOrGroup);
                }
            }
            if (!result[layerId].length) delete result[layerId];
        }

        return result;
    }

    render() {
        const {
            layerId, filterState, orGroupIndex, andGroupIndex,
            showRemoveFilterButton,
        } = this.props;
        const {
            localInputValue,
        } = this.state;

        const isFilterAttrSelected = !!filterState.filterId;

        let operatorConfig, showOperatorSelect, defaultOperatorId;
        let filterConfig;
        if (isFilterAttrSelected) {
            filterConfig = this.getLayerFilterConfig(filterState.filterId);
            showOperatorSelect = !!filterConfig.show_comparison_operators;
            if (showOperatorSelect) {
                // `defaultOperatorId` передаём в подкомпонент, чтобы тот не искал его повторно
                defaultOperatorId = filterConfig.default_comparison_operator;
            }
            operatorConfig = this.getOperatorConfig(filterState.operatorId);
        }

        // Если true, то:
        //    - этот фильтр отображается по умолчанию;
        //    - его нельзя удалить;
        //    - пустое значение не допускается (должно быть установлено дефолтное в конфиге инпута);
        //    - вместо кнопки "Очистить" отображается "По умолчанию"
        const isFilterRequired = !!(filterConfig && filterConfig.required);

        let valueChangeHandler;
        if (isFilterAttrSelected) {
            valueChangeHandler = operatorConfig.inputTypeId === 'select'
                ? this.onAppliedValueChange
                : this.onLocalInputValueChange;
        }

        return (
            <div className="map_layer_filter">
                <MapLayerFilterSelect
                    layerId={layerId} selectedFilterId={filterState.filterId} onItemClick={this.onFilterSelectItemClick}
                    brightDisabled={isFilterRequired}
                />
                {isFilterAttrSelected && showOperatorSelect &&
                    <MapLayerFilterOperatorSelect layerId={layerId} filterId={filterState.filterId} defaultOperatorId={defaultOperatorId}
                        selectedOperatorId={filterState.operatorId} onItemClick={this.onOperatorSelectItemClick}
                    />
                }
                {isFilterAttrSelected &&
                    <MapLayerFilterInput layerId={layerId} filterId={filterState.filterId} inputTypeId={operatorConfig.inputTypeId} inputId={operatorConfig.inputId}
                        value={localInputValue} onValueChange={valueChangeHandler} required={isFilterRequired}
                    />
                }
                {isFilterAttrSelected &&
                    <div className="map_layer_filter_buttons">
                        {/* Для селектов применение фильтра происходит после выбора элемента списка; у остальных будет отдельная кнопка */}
                        {(operatorConfig.inputTypeId !== 'select') &&
                            <button type="button" onClick={this.onApplyButtonClick} className="map_layer_filter_button map_layer_filter_button_green">Применить</button>
                        }
                        {isFilterRequired &&
                            <button type="button" className="map_layer_filter_button">По умолчанию</button>
                        }
                        {/*кнопку "Очистить* можно сделать крестиком в инпутах*/}
                        {!isFilterRequired &&
                            <button type="button" onClick={this.onClearInputButtonClick} className="map_layer_filter_button">Очистить</button>
                        }
                        {showRemoveFilterButton &&
                            <button type="button" onClick={this.onRemoveFilterButtonClick} className="map_layer_filter_button map_layer_filter_button_red">Удалить</button>
                        }
                    </div>
                }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        layersById: state.mapPage.layers.layersById,
        sandboxFiltersByLayerId: state.mapPage.sandboxFilter.filtersByLayerId,
    };
}

export default connect(mapStateToProps)(MapLayerFilter);
