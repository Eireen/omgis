import ForbiddenErrorBlock from './ForbiddenErrorBlock';
import React from 'react';

export default class PageForbidden extends React.Component {

    defaultMessage = 'Вы не имеете доступа к этой странице'

    componentDidMount() {
        document.title = `${this.defaultMessage}`;
    }

    render() {
        const { message = this.defaultMessage } = this.props;

        return (
            <div className="page_main_in">
                <ForbiddenErrorBlock {...{ message }} />
            </div>
        );
    }
}
