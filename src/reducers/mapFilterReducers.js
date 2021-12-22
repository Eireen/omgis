// Данный модуль содержит редьюсеры для фильтров карты - активного и "песочного" (sandbox).
// Активный и "песочный" фильтры однотипны по структуре.
// Активный фильтр (поле `filter` в сторе) - тот, который применён к карте (с учётом которого отрисована картинка на карте).
// "Песочный" фильтр (поле `sandboxFilter` в сторе) - тот, который редактируется пользователем, но ещё не применён к карте.
// Когда пользователь жмёт кнопку "Добавить фильтр", в `sandboxFilter` создаётся пустой слот под фильтр, который пока ещё не заполнен значениями.
// Когда пользователь выбирает значение в селекте, либо редактирует инпут и жмёт кнопку "Применить", `sandboxFilter` копируется в `filter`.

import { types as mapPageActionTypes } from '../actions/mapPage';
import update from 'immutability-helper';
import { combineReducers } from 'redux';
import { clone } from '../utils/common';
import { toUpperCaseFirst } from '../utils/string';


function getDefaultLayerFiltersConfig() {
    return [[
        { filterId: null, operatorId: null, value: null },
    ]];
}

// Собирает дефолтные фильтры для указанных слоёв и возвращает конфиг для стейта
function getDefaultFilters(filtersByLayerId, layerIds, layersById, references) {
    let filtersConfig;

    for (let layerId of layerIds) {
        if (filtersByLayerId[layerId]) {
            continue;
        }

        let newLayerState = [[]];
        const layerConfig = layersById[layerId];

        if (!layerConfig.filters || !layerConfig.filters.length) continue;

        // Сначала ищем те фильтры, что должны быть установлены по дефолту (т. е. required)
        for (let filter of layerConfig.filters) {
            if (!filter.required && !filter.show_by_default) continue;

            let defaultOp;
            for (let op of filter.operators) {
                if ((filter.default_comparison_operator && filter.default_comparison_operator === op.operatorId) ||
                    (!filter.default_comparison_operator && defaultOp === undefined))
                {
                    defaultOp = op;
                }
            }
            const { inputTypeId, inputId } = defaultOp;
            const inputReferenceName = `all${toUpperCaseFirst(inputTypeId)}InputsById`;
            const inputConfig = references[inputReferenceName][inputId];

            const defaultValue = inputConfig.default_value_builder
                ? eval(inputConfig.default_value_builder)
                : null;

            newLayerState[0].push({
                filterId: filter.id,
                operatorId: filter.default_comparison_operator || filter.operators[0].operatorId,
                value: defaultValue,
            });
        }

        // Если дефолтных установленных фильтров у слоя нет, поставить пустой слот
        if (!newLayerState[0].length) {
            newLayerState = getDefaultLayerFiltersConfig();
        }

        if (!filtersConfig) filtersConfig = {};
        filtersConfig[layerId] = newLayerState;
    }

    return filtersConfig;
}


const commonFilterReducers = {
    [mapPageActionTypes.layers.TOGGLE_LAYERS]: function(state, action) {
        // Сразу при включении слоя ставим его дефолтные фильтры, если есть

        const { layerIds, visibleLayerIds } = action.payload;

        if (layerIds && layerIds[0] && ~visibleLayerIds.indexOf(layerIds[0])) {
            // Если происходит скрытие слоёв, то с фильтрами ничего не делать - дефолтные уже были установлены ранее
            // при включении слоёв, а сохранять текущие настройки удобнее для пользователя
            return state;
        }

        const layerConfigs = action.payload;

        const { layersById, references } = action.payload;

        const filtersConfig = getDefaultFilters(state, layerIds, layersById, references);

        return (filtersConfig
            ? Object.assign({}, state, filtersConfig)
            : state
        );
    },

    [mapPageActionTypes.filters.REMOVE_FILTER]: function(state, action) {
        const { layerId, orGroupIndex, andGroupIndex } = action.payload;

        const newLayerState = clone(state[layerId]);
        newLayerState[orGroupIndex].splice(andGroupIndex, 1);
        if (!newLayerState[orGroupIndex].length) {
            newLayerState.splice(orGroupIndex, 1);
        }

        return update(state, { [layerId]: { $set: newLayerState } });
    },

    [mapPageActionTypes.filters.SET_FILTERS]: function(state, action) {
        const { layerId, filterConfigs } = action.payload;
        // filterGroupIndex - индекс OR-группы
        // filterIndex - индекс фильтра внутри AND-группы

        const newState = clone(state);
        if (!newState[layerId]) {
            newState[layerId] = getDefaultLayerFiltersConfig();
        }

        // WARNING: здесь устанавливаются значения только ранее добавленных фильтров;
        // т. е. в норме этот action может срабатывать только после TOGGLE_LAYERS
        for (let { filterGroupIndex, filterIndex, filterState } of filterConfigs) {
            if (filterGroupIndex >= state.length) {
                console.warn(`Невалидный индекс OR-группы фильтров: ${filterGroupIndex} при длине массива ${state.length}`);
                continue;
            }
            if (filterIndex >= newState[layerId][filterGroupIndex].length) {
                console.warn(`Невалидный индекс AND-группы фильтров: ${filterIndex} при длине массива ${newState[layerId][filterGroupIndex].length}`);
                continue;
            }
            newState[layerId][filterGroupIndex][filterIndex] = filterState;
        }

        return newState;
    },

    [mapPageActionTypes.filters.SPLIT_AND_GROUPS]: function(state, action) {
        // При выборе логического оператора "ИЛИ" разделяет AND-группу (2-го уровня массива) на две

        const { layerId, orGroupIndex, andGroupIndex } = action.payload;

        const newLayerState = clone(state[layerId]);
        const oldOrGroup = clone(state[layerId][orGroupIndex]);
        newLayerState[orGroupIndex] = oldOrGroup.slice(0, andGroupIndex);
        newLayerState.splice(orGroupIndex + 1, 0, oldOrGroup.slice(andGroupIndex));

        return update(state, { [layerId]: { $set: newLayerState } });
    },

    [mapPageActionTypes.filters.MERGE_OR_GROUPS]: function(state, action) {
        // При выборе логического оператора "И" сливает две OR-группы (1-го уровня массива)

        const { layerId, orGroupIndex } = action.payload;

        const oldLayerState = clone(state[layerId]);
        let newLayerState = oldLayerState.slice(0, orGroupIndex - 1);
        newLayerState.push(
            oldLayerState[orGroupIndex - 1].concat(oldLayerState[orGroupIndex])
        );
        newLayerState = newLayerState.concat(
            oldLayerState.slice(orGroupIndex + 1)
        );

        return update(state, { [layerId]: { $set: newLayerState } });
    },
};

const activeFilterReducers = {
    [mapPageActionTypes.filters.APPLY_FILTERS]: function(state, action) {
        return action.payload.filtersByLayerId;
    },
};

const sandboxFilterReducers = {
    [mapPageActionTypes.filters.APPLY_SANDBOX_FILTERS]: function(state, action) {
        return action.payload.filtersByLayerId;
    },

    [mapPageActionTypes.filters.ADD_FILTERS]: function(state, action) {
        const { layerId, filterStates } = action.payload;

        const newState = clone(state);
        if (!newState[layerId]) {
            newState[layerId] = getDefaultLayerFiltersConfig();
        }

        // WARNING: здесь устанавливаются значения только ранее добавленных фильтров;
        // т. е. в норме этот action может срабатывать только после TOGGLE_LAYERS
        // (TOGGLE_LAYERS создаёт необходимую структуру массивов)
        const lastANDGroup = newState[layerId][newState[layerId].length - 1]; // последняя AND-группа
        // Add `filterStates` to the last AND group
        lastANDGroup.splice(lastANDGroup.length, 0, ...filterStates);

        return newState;
    },

    [mapPageActionTypes.filters.SET_SANDBOX_FILTERS]: commonFilterReducers[mapPageActionTypes.filters.SET_FILTERS],
};


function getReducersForFilter(filterType) {
    const reducers = Object.assign({},
        commonFilterReducers,
        filterType === 'active'
            ? activeFilterReducers
            : sandboxFilterReducers
        );

    return function(state = {}, action) {
        if (reducers[action.type]) return reducers[action.type](state, action);
        return state;
    }
}


const reducers = {
    filter: combineReducers({
        filtersByLayerId: getReducersForFilter('active'),
    }),
    sandboxFilter: combineReducers({
        filtersByLayerId: getReducersForFilter('sandbox'),
    }),
};

export default reducers;
