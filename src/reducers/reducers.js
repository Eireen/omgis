import { combineReducers } from 'redux';
import { clone } from '../utils/common';
import update from 'immutability-helper';
import mapFilterReducers from './mapFilterReducers';
import pointDetailsReducers from './pointDetailsReducers';

import {
    SHOW_POPUP,
    UPDATE_POPUP,
    CLOSE_POPUP,

    TOGGLE_FEEDBACK_POPUP,
} from '../actions/actions';

import { types as mapPageActionTypes } from '../actions/mapPage';
import { types as cacheActionTypes } from '../actions/cache';

const zoomingToLayerExtent_defaultData = { layerId: null };
const mapCanvasSize_defaultData = { width: 0, height: 0 };


function popupStack(state = [], action) {
    switch (action.type) {
        case SHOW_POPUP: // add the given popup to the popup stack
            return state.concat(action.payload);
        case UPDATE_POPUP: { // скобки добавлены от ошибки при сборке: Duplicate declaration "result"
            let result = state.slice();
            if (result.length) {
                result[result.length - 1] = action.payload;
            }
            return result;
        }
        case CLOSE_POPUP: {
            let result = state.slice();
            result.pop();
            return result;
        }
        default:
            return state;
    }
}

function feedbackForm(state = { isVisible: false }, action) {
    switch (action.type) {
        case TOGGLE_FEEDBACK_POPUP:
            return Object.assign({}, state, { isVisible: !state.isVisible });
        default:
            return state;
    }
}

function cache(state = {}, action) {
    switch (action.type) {
        case cacheActionTypes.SET_CACHE_ITEMS: {
            const updateConfig = {};
            for (let { key, value } of action.payload) {
                updateConfig[key] = { $set: value };
            }
            return update(state, updateConfig);
        }
        default:
            return state;
    }
}


const rootReducer = combineReducers({
    popupStack,
    feedbackForm,
    mapPage: combineReducers({
        mainMenu: combineReducers({
            activeItemId: function(state = null, action) {
                switch (action.type) {
                    case mapPageActionTypes.mainMenu.SET_ACTIVE_ITEM_ID:
                        return action.payload;
                    default:
                        return state;
                };
            },
            items: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.mainMenu.SET_ITEMS:
                        return action.payload;
                    default:
                        return state;
                };
            },
        }),
        layers: combineReducers({
            layerTree: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SET_LAYER_TREE:
                        return action.payload.layerTree;
                    default:
                        return state;
                };
            },
            references: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SET_LAYER_TREE:
                        return action.payload.references;
                    default:
                        return state;
                };
            },
            openLayerTreeNodeIds: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.TOGGLE_LAYER_GROUPS: {
                        const treeNodeIds = action.payload;
                        let result = state.slice();

                        for (let treeNodeId of treeNodeIds) {
                            if (~state.indexOf(treeNodeId)) {
                                result = result.filter(item => item !== treeNodeId);
                            } else {
                                result.push(treeNodeId);
                            }
                        }

                        return result;
                    }
                    default:
                        return state;
                };
            },
            visibleLayerIds: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.TOGGLE_LAYERS: {
                        const { layerIds } = action.payload;
                        let newState = state.slice();

                        for (let layerId of layerIds) {
                            if (~state.indexOf(layerId)) {
                                newState = newState.filter(item => item !== layerId);
                            } else {
                                newState.push(layerId);
                            }
                        }

                        return newState;
                    }
                    default:
                        return state;
                };
            },
            layersById: function(state = {}, action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SET_LAYER_TREE:
                        const layerTree = action.payload.layerTree;
                        return getLayersById(layerTree);
                    default:
                        return state;
                };
            },
            infoLayerId: function(state = null, action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SHOW_LAYER_INFO_PANEL:
                        return action.payload.layerId;
                    case mapPageActionTypes.layers.HIDE_LAYER_INFO_PANEL:
                        return null;
                    default:
                        return state;
                };
            },
            selectedThemeIds: function(state = [], action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SET_THEMES: {
                        // Передаём новый массив выбранных themeIds полностью
                        const { themeIds } = action.payload;
                        return themeIds && themeIds.slice() || [];
                    }
                    default:
                        return state;
                };
            },
            zoomingToLayerExtent: function(state = zoomingToLayerExtent_defaultData, action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.START_ZOOMING_TO_LAYER_EXTENT:
                        return {
                            layerId: action.payload.layerId,
                        };
                    case mapPageActionTypes.layers.END_ZOOMING_TO_LAYER_EXTENT:
                        return zoomingToLayerExtent_defaultData;
                    default:
                        return state;
                }
            },
            opacityByLayerId: function(state = {}, action) {
                switch (action.type) {
                    case mapPageActionTypes.layers.SET_LAYERS_OPACITY: {
                        const newOpacityByLayerId = action.payload,
                            newState = { ...state };

                        for (let layerId in newOpacityByLayerId) {
                            // Отсеиваем из нового стейта недефолтную прозрачность (дефолт === 1)
                            if (newOpacityByLayerId[layerId] === 1) {
                                if (newState[layerId] !== undefined) delete newState[layerId];
                            } else {
                                newState[layerId] = newOpacityByLayerId[layerId];
                            }
                        }

                        return newState;
                    }
                    case mapPageActionTypes.layers.RESET_LAYERS_OPACITY:
                        return {};
                    default:
                        return state;
                }
            }
        }),
        ...mapFilterReducers,
        ...pointDetailsReducers,
        mapCanvas: combineReducers({
            size: function(state = mapCanvasSize_defaultData, action) {
                switch (action.type) {
                    case mapPageActionTypes.mapCanvas.SET_MAP_CANVAS_SIZE: {
                        const newSize = action.payload;
                        const newState = { ...state };
                        for (let field of ['width', 'height']) {
                            if (newSize[field] === undefined) continue;
                            newState[field] = newSize[field];
                        }
                        // Return `newState` if it differs from `state`
                        return (newState.width === state.width && newState.height === state.height
                            ? state
                            : newState);
                    }
                    case mapPageActionTypes.mapCanvas.CLEAR_MAP_CANVAS_SIZE: {
                        // Сброс размеров карты при выходе из раздела "Карта"
                        return mapCanvasSize_defaultData;
                    }
                    default:
                        return state;
                }
            },
        }),
    }),
    cache,
});

/* Обход дерева слоёв карты и составление справочника слоёв по их ID */
function getLayersById(layerTree, parentNode = null, layersById = {}) {
    for (let node of layerTree) {
        if (node.subnodes) {
            getLayersById(node.subnodes, node, layersById);
        } else {
            layersById[node.id] = node;

            // Костыль: попутно сохраняем ссылку на узел-родитель
            node.parentNode = parentNode;
        }
    }
    return layersById;
}

export default rootReducer;
