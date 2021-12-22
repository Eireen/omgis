export const types = {
    SET_CACHE_ITEMS: 'cache/SET_CACHE_ITEMS',
};

export const creators = {
    setCacheItems: data => ({
        type: types.SET_CACHE_ITEMS,
        payload: data,
    }),
};
