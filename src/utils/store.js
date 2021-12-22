let _store = {};

export default {
    set(key, value) {
        _store[key] = value;
    },

    unset(key) {
        delete _store[key];
    },

    get(key) {
        return _store[key];
    }
};
