import { createStore, applyMiddleware } from 'redux';
import rootReducer from './reducers/reducers';

// Middleware для доступа к полному стейту из редьюсеров.
// Понадобилось для доступа из редьюсера к разным частям стейта
const fullStateAccessMiddleware = store => next => action => {
    next({ ...action, getFullState: store.getState });
}

export default function configureStore(preloadedState) {
    const middlewareEnhancer = applyMiddleware(fullStateAccessMiddleware);

    const store = createStore(
        rootReducer,
        preloadedState,
        middlewareEnhancer,
    );

    window._reduxStore = store; // debug; TODO: remove!!!!!!!
    return store;
}

/*
Структура стора:

{
    // Стек попапов (когда один попап открывается из другого; отображается последний элемент массива)
    // Используется, например, при просмотре графика по клику в попапе с детальным отчетом по водпостам
    popupStack: [<Component>],

    // Попап с формой обратной связи
    feedbackForm: {
        isVisible: false,  // отображается ли
    },

    mapPage: {
        mainMenu: {
            activeItemId: null,
            items: [
                {
                    id: 'layers',
                    label: 'Слои',
                    icon: 'icn_layers_smaller_navy',
                    content: MapLayersPanelWrap,
                },
                ...
            ],
        },
        layers: {
            layerTree: [],
            references: {}, // Справочники для фильтров (`allSelectInputsById`, `allComparisonOperatorsById` и др.)
            openLayerTreeNodeIds: [],
            visibleLayerIds: [],
            layersById: {},  // Справочник всех слоёв с ключом по ID - для удобного и быстрого доступа
            infoLayerId: 12, // ID слоя, инфопанель которого просматривается пользователем в данный момент
            selectedThemeIds: [],
            // Триггер масштабирования к полному охвату слоя layerId. Когда layerId непустой - значит нужно начать масштабирование.
            // При окончании машстабирования layerId сбрасывается
            zoomingToLayerExtent: {
                layerId: 12,
            },
            opacityByLayerId: {
                12: 0.5, //  [layerId]: [opacity]
            },
        },
        filter: {
            filtersByLayerId: { // Включённые фильтры, сгруппированные по ID активных слоёв
                12: [
                    // ID слоя указывает на двумерный массив - группы фильтров, объединяемые логическим оператором ИЛИ.
                    // Внутри групп элементы объединяются логическим оператором И.
                    // Таким образом реализуется приоритет выполнения фильтров, объединённых разными операторами (сначала И, потом ИЛИ).
                    // По умолчанию создаётся одна группа.
                    [
                        // Это группа фильтров, объединённых оператором И
                        {
                            filterId: 5,
                            operatorId: '>=',
                            value: '2002',
                        },
                        {
                            filterId: 5,
                            operatorId: '<=',
                            value: '2004',
                        },
                    ],
                    // ... ИЛИ ...
                    [
                        // Другая группа фильтров, объединённых оператором И
                    ],
                ],
            },
        },
        // `sandboxFilter` повторяет структуру `filter`. Используется для хранения промежуточной структуры фильтра при его редактировании
        sandboxFilter: { ... },

        // Данные о точке, кликнутой пользователем на карте
        pointDetails: {
            coords: {
                pixel: {
                    relative: { x, y },
                },
                latLng: { lat: 0, lng: 0 },
            },
            altitude: {
                value: 1234,
                resolution: "5000m",
            },
            popup: {
                isVisible: false, // попап с данными
                contentHTML: '...', // содержимое попапа в виде HTML
                contentComponent: '...', // содержимое попапа в виде React Element/Component
                contentStyle: {}, // кастомные стили срединного контента попапа (т. е. не включающего верхний и нижний тулбары). Добавлено для возможности установки `max-height`. Устанавливается, когда дефолтная высота попапа не вмещается в пределах карты по вертикали, и срединный контент приходится сжимать
            },
        },

        mapCanvas: { // различные параметры полотна карты
            size: { // размеры полотна карты
                width: 0,
                height: 0
            },
        },

        edit: {
        },
    },

    // Кэш всяких значений
    // TODO: подумать над этим костылём
    cache: {},

    // ... TO BE CONTINUED ...
}
*/
