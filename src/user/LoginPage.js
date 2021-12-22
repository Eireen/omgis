import LoginFormContainer from './LoginFormContainer';
import React from 'react';
import store from '../utils/store';

export default class LoginPage extends React.Component {

    componentDidMount() {
        document.title = `Вход | ${store.get('siteTitle')}`;
    }

    render() {
        const { loadUnreadNews } = this.props;

        return (
            <div className="page_main center">
                <div className="page_main_in">
                    <LoginFormContainer {...{ loadUnreadNews }} />
                </div>
            </div>
        );
    }
}
