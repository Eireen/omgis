import NotFoundErrorBlock from './NotFoundErrorBlock';
import React from 'react';

export default class PageNotFound extends React.Component {

    defaultMessage = 'Страница не найдена'

    render() {
        const { message = this.defaultMessage } = this.props;

        return (
            <div className="page_main_in">
                <NotFoundErrorBlock {...{ message }} />
            </div>
        );
    }
}
