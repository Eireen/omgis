export const types = {
    mainMenu: {
        SET_ACTIVE_ITEM_ID: 'mapPage/mainMenu/SET_ACTIVE_ITEM_ID',
        SET_ITEMS: 'mapPage/mainMenu/SET_ITEMS',
    },
    layers: {
        SET_LAYER_TREE: 'mapPage/layers/SET_LAYER_TREE',
        TOGGLE_LAYERS: 'mapPage/layers/TOGGLE_LAYERS',
        TOGGLE_LAYER_GROUPS: 'mapPage/layers/TOGGLE_LAYER_GROUPS',
        SHOW_LAYER_INFO_PANEL: 'mapPage/layers/SHOW_LAYER_INFO_PANEL',
        HIDE_LAYER_INFO_PANEL: 'mapPage/layers/HIDE_LAYER_INFO_PANEL',
        SET_THEMES: 'mapPage/layers/SET_THEMES',
        START_ZOOMING_TO_LAYER_EXTENT: 'mapPage/layers/START_ZOOMING_TO_LAYER_EXTENT',
        END_ZOOMING_TO_LAYER_EXTENT: 'mapPage/layers/END_ZOOMING_TO_LAYER_EXTENT',
        SET_LAYERS_OPACITY: 'mapPage/layers/SET_LAYERS_OPACITY',
        RESET_LAYERS_OPACITY: 'mapPage/layers/RESET_LAYERS_OPACITY',
    },
    filters: {
        // устанавливает активный фильтр целиком из payload (используется для переноса песочного фильтра в активный)
        APPLY_FILTERS: 'mapPage/filters/APPLY_FILTERS',
        // устанавливает sandbox-фильтр целиком из payload (используется для инициализации песочного фильтра активным)
        APPLY_SANDBOX_FILTERS: 'mapPage/filters/APPLY_SANDBOX_FILTERS',
        // Добавление слота под фильтр (когда пользователь жмёт кнопку "Добавить фильтр")
        ADD_FILTERS: 'mapPage/filters/ADD_FILTERS',
        // Удаление фильтра
        REMOVE_FILTER: 'mapPage/filters/REMOVE_FILTER',
        // Установка параметров фильтра (когда пользователь выбирает атрибут, оператор или значение)
        SET_FILTERS: 'mapPage/filters/SET_FILTERS',
        // То же, что SET_FILTERS, но применяется только к песочному фильтру (а SET_FILTERS применяется к обоим фильтрам)
        SET_SANDBOX_FILTERS: 'mapPage/filters/SET_SANDBOX_FILTERS',
        // Когда пользователь выбирает значение "ИЛИ" в селекте логического оператора (т. е. нужно разделить массив с конъюнктивно объединёнными фильтрами на два, таки образом получив 2 группы, объединяемые оператором ИЛИ)
        // См. также пояснение к полю `filter` в файле `configureStore.js`
        SPLIT_AND_GROUPS: 'mapPage/filters/SPLIT_AND_GROUPS',
        // Когда пользователь выбирает значение "И" в селекте логического оператора (т. е. нужно слить 2 соседних дизъюнктивно объединённых И-массива фильтров в один, таки образом получив одну И-группу фильтров)
        // См. также пояснение к полю `filter` в файле `configureStore.js`
        MERGE_OR_GROUPS: 'mapPage/filters/MERGE_OR_GROUPS',
    },
    pointDetails: {
        SHOW_POINT_DETAILS: 'mapPage/pointDetails/SHOW_POINT_DETAILS',
        HIDE_POINT_DETAILS: 'mapPage/pointDetails/HIDE_POINT_DETAILS',

        SET_POPUP_CONTENT_STYLE: 'mapPage/pointDetails/SET_POPUP_CONTENT_STYLE',
        CLEAR_POPUP_CONTENT_STYLE: 'mapPage/pointDetails/CLEAR_POPUP_CONTENT_STYLE',

        SET_POINT_ALTITUDE: 'mapPage/pointDetails/SET_POINT_ALTITUDE',
    },
    mapCanvas: {
        SET_MAP_CANVAS_SIZE: 'mapPage/mapCanvas/SET_MAP_CANVAS_SIZE',
        CLEAR_MAP_CANVAS_SIZE: 'mapPage/mapCanvas/CLEAR_MAP_CANVAS_SIZE', // Сброс размеров карты при выходе из раздела "Карта"
    },
};

export const creators = {
    mainMenu: {
        setActiveItemId: data => ({
            type: types.mainMenu.SET_ACTIVE_ITEM_ID,
            payload: data,
        }),
        setItems: data => ({
            type: types.mainMenu.SET_ITEMS,
            payload: data,
        }),
    },
    layers: {
        setLayerTree: data => ({
            type: types.layers.SET_LAYER_TREE,
            payload: data,
        }),
        toggleLayerGroups: data => ({
            type: types.layers.TOGGLE_LAYER_GROUPS,
            payload: data,
        }),
        toggleLayers: data => ({
            type: types.layers.TOGGLE_LAYERS,
            payload: data,
        }),
        showLayerInfoPanel: data => ({
            type: types.layers.SHOW_LAYER_INFO_PANEL,
            payload: data,
        }),
        hideLayerInfoPanel: data => ({
            type: types.layers.HIDE_LAYER_INFO_PANEL,
            payload: data,
        }),
        setThemes: data => ({
            type: types.layers.SET_THEMES,
            payload: data,
        }),
        startZoomingToLayerExtent: data => ({
            type: types.layers.START_ZOOMING_TO_LAYER_EXTENT,
            payload: data,
        }),
        endZoomingToLayerExtent: data => ({
            type: types.layers.END_ZOOMING_TO_LAYER_EXTENT,
            payload: data,
        }),
        setLayersOpacity: data => ({
            type: types.layers.SET_LAYERS_OPACITY,
            payload: data,
        }),
        resetLayersOpacity: data => ({
            type: types.layers.RESET_LAYERS_OPACITY,
            payload: data,
        }),
    },
    filters: {
        applyFilters: data => ({
            type: types.filters.APPLY_FILTERS,
            payload: data,
        }),
        applySandboxFilters: data => ({
            type: types.filters.APPLY_SANDBOX_FILTERS,
            payload: data,
        }),
        addFilters: data => ({
            type: types.filters.ADD_FILTERS,
            payload: data,
        }),
        removeFilter: data => ({
            type: types.filters.REMOVE_FILTER,
            payload: data,
        }),
        setFilters: data => ({
            type: types.filters.SET_FILTERS,
            payload: data,
        }),
        setSandboxFilters: data => ({
            type: types.filters.SET_SANDBOX_FILTERS,
            payload: data,
        }),
        splitAndGroups: data => ({
            type: types.filters.SPLIT_AND_GROUPS,
            payload: data,
        }),
        mergeOrGroups: data => ({
            type: types.filters.MERGE_OR_GROUPS,
            payload: data,
        }),
    },
    pointDetails: {
        showPointDetails: data => ({
            type: types.pointDetails.SHOW_POINT_DETAILS,
            payload: data,
        }),
        hidePointDetails: () => ({
            type: types.pointDetails.HIDE_POINT_DETAILS,
        }),
        setPopupContentStyle: data => ({
            type: types.pointDetails.SET_POPUP_CONTENT_STYLE,
            payload: data,
        }),
        clearPopupContentStyle: () => ({
            type: types.pointDetails.CLEAR_POPUP_CONTENT_STYLE,
        }),
        setPointAltitude: data => ({
            type: types.pointDetails.SET_POINT_ALTITUDE,
            payload: data,
        }),
    },
    mapCanvas: {
        setMapCanvasSize: data => ({
            type: types.mapCanvas.SET_MAP_CANVAS_SIZE,
            payload: data,
        }),
        clearMapCanvasSize: data => ({
            type: types.mapCanvas.CLEAR_MAP_CANVAS_SIZE,
        }),
    },
};
