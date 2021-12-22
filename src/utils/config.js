import fetch from 'isomorphic-fetch';
import store from './store';

let config = null;

async function loadConfig() {
    const response = await fetch('/config.json', { cache: 'no-cache' });
    config = await response.json();

    // копируем в store
    for (let key in config) {
        store.set(key, config[key]);
    }
    return config;
}

export default config
    ? Promise.resolve(config)
    : loadConfig();
