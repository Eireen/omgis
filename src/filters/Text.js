import React from 'react';
import classNames from 'classnames';

export default class Text extends React.Component {

    render() {
        const {
            action, // URL, который обрабатывает фильтр (если это поле указано - браузер перенаправляется на него вместо текущего урла)
            param,
            value = '',
            label,
            filter,
            onSubmit,
            onChange
        } = this.props;

        return (
            <form action={action} method="GET" className="search_form" onSubmit={onSubmit}>
                <input type="text" name={param} value={value} placeholder={label} onChange={onChange} />
                <input type="submit" value="" className="icn icn_search" />
            </form>
        );
    }
}
