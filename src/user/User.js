import { clearUserAnalyticsData } from '../utils/analytics';
import jwtDecode from 'jwt-decode';
import api from '../api';

var User;

export function setupUser() {
    if (User) return User;

    User = {
        async authenticate(formData = {}) {
            const user = await api.post('authentication', formData, {}, { credentials: 'include' }, false);
            this.save(user);
            this.tuneDebugTool(user);
        },

        async authenticateSilently() {
            try {
                await this.authenticate();
            } catch(error) {
                // При отказе в аутентификации приходит 403
                console.log(error);
                return false;
            }
            return true;
        },

        logout() {
            this.clear();

            clearUserAnalyticsData();
        },

        save(user) {
            localStorage.setItem('user', JSON.stringify(user));
            this._loadData();
        },

        tuneDebugTool(user) {
            const dataForRollbar = {
                id: user.id,
                username: user.login,
            };

            if (window.Rollbar) { // если Rollbar уже загружен
                window.Rollbar.configure({
                    payload: {
                        person: dataForRollbar
                    }
                });
            } else if (window._rollbarConfig) { // если Rollbar еще не загружен
                if (!window._rollbarConfig.payload) {
                    window._rollbarConfig.payload = {}
                }
                window._rollbarConfig.payload.person = dataForRollbar;
            }
        },

        clear() {
            localStorage.removeItem('user');
            this._data = null;
        },

        get isAuthenticated() {
            return !this.isAuthExpired;
        },

        get isAuthExpired() {
            if (!this.data || !this.data.token) return true;

            let isExpired;

            try {
                const tokenData = jwtDecode(this.data.token);
                isExpired = !tokenData.exp || tokenData.exp * 1000 < +new Date();
            } catch (error) {
                isExpired = true;
            }

            if (isExpired) {
                this.clear();
                return true;
            }

            return false;
        },

        get data() {
            if (!this._data) {
                this._loadData();
            }
            return this._data;
        },

        _loadData() {
            const rawUser = localStorage.getItem('user');
            if (!rawUser) {
                this._data = null;
                return;
            }

            let _data;
            try {
                _data = JSON.parse(rawUser);
            } catch(error) {
                alert('Ошибка при получении данных о пользователе из локального хранилища');
                return;
            }
            this._data = _data;
        },

        get id() {
            return this.data && this.data.id;
        },

        get name() {
            return this.data && this.data.name || '';
        },

        get token() {
            return this.data && this.data.token;
        },

        get roles() {
            return this.data && this.data.roles || [];
        },

        get permissions() {
            return this.data && this.data.permissions || {};
        },

        can(permission) {
            return !!this.permissions[permission];
        },

        hasRole(role) {
            return !!~this.roles.indexOf(role);
        },
    };

    return User;
}

setupUser();

export default User;
