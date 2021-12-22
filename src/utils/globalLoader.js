export function hideGlobalLoader() {
    setTimeout(() => { // делаем таймаут, чтобы успел обновиться DOM
        const loader = document.querySelector('.global-loader-container');
        if (loader) loader.style.display = 'none';

        document.body.classList.remove('global-loader-enabled');
    }, 0);
};