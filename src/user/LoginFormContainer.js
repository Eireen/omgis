import React from 'react';
import LoginForm from './LoginForm';
import update from 'immutability-helper';
import $ from 'jquery';
import User from './User';
import page from 'page';
import api from '../api';

export default class LoginFormContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            formData: {
                login: '',
                password: ''
            },
            error: '',
            processing: false
        };
    }

    onChange = event => {
        event.preventDefault();

        const name = event.target.name;
        const value = event.target.value;
        const targetElement = event.target; // 'cause of event pooling
        this.setState(prevState => {
            const newState = update(prevState, {
                formData: {
                    [name]: {
                        $set: value
                    }
                }
            });

            /* https://github.com/iamJoeTaylor/vanilla-autofill-event/issues/4
            "Chrome security policy does not allow detection of password autofills
            until user interacts with the page in some way. For my case, I ended up
            just detecting the autofill of the username field and using that to
            trigger whatever I need for the password field as well" */
            if (name !== 'password') {
                const newPassword = $(targetElement).parents('form').find('input[name="password"]').val();
                newState.formData.password = newPassword;
            }

            return newState;
        });
    }

    onSubmit = async event => {
        event.preventDefault();

        if (!this.validate()) return;

        this.processingModeOn(); // clear error message and disable submit button

        // In iOS device, send UDID for immediate authentication further
        const formData = Object.assign({}, this.state.formData);

        try {
            await User.authenticate(formData);
        } catch (error) {
            console.log(error);

            let message;
            switch (error.status) {
                case 403:
                    message = 'Неверный логин или пароль';
                    break;
                default:
                    message = `Ошибка: \n\n${error.message}`;
            }

            this.processingModeOff(message);
            return;
        }

        this.processingModeOff();

        page('/');

        const { loadUnreadNews } = this.props;
        loadUnreadNews && loadUnreadNews();

        api.registerLastLogin();
    }

    validate() {
        if (this.hasEmptyFields()) {
            this.setState({ error: 'Оба поля обязательны к заполнению' });
            return false;
        }
        return true;
    }

    hasEmptyFields() {
        const { formData } = this.state;
        for (let key in formData) {
            let value = formData[key];
            if (!value) return true;
        }
        return false;
    }

    processingModeOn() {
        this.setState(prevState =>
            update(prevState, {
                error: { $set: '' },
                processing: { $set: true }
            })
        );
    }

    processingModeOff(error = '') {
        this.setState(prevState =>
            update(prevState, {
                error: { $set: error },
                processing: { $set: false }
            })
        );
    }

    render() {
        return (
            <LoginForm
                formData={this.state.formData}
                onChange={this.onChange}
                onSubmit={this.onSubmit}
                error={this.state.error}
                processing={this.state.processing}
            />
        );
    }
}
