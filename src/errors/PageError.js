import ErrorBlock from './ErrorBlock';
import React from 'react';

export default class PageError extends React.Component {

    componentDidMount() {
        document.title = `Ошибка`;
    }

    render() {
        const { error, message } = this.props;

        return (
            <div className="page_main_in">
                <ErrorBlock {...{ error, message }} />
            </div>
        );
    }
}
