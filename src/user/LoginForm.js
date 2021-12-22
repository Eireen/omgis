import React from 'react';

const LoginForm = ({
    formData,
    onChange,
    onSubmit,
    error,
    processing
}) => (
    <form className="authorization_form" action="" method="POST" onSubmit={onSubmit}>
        <div className="h2">
            <i className="icn icn_auth_big"></i>&nbsp;
            <span>Авторизация</span>
        </div>
        <div className="form_row field-loginform-login required">
            <input
                type="text"
                name="login"
                value={formData.login}
                onChange={onChange}
                className="input_text wide"
                placeholder="Логин"
            />
        </div>
        <div className="form_row field-loginform-password required">
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                className="input_text wide"
                placeholder="Пароль"
            />
            <span className="error_text">{error}</span>
        </div>
        <div className="form_row">
            <button type="submit" className="btn btn_mid btn_tomato wide" disabled={processing}>Войти</button>
        </div>
    </form>
);

export default LoginForm;
