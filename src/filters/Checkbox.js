import React from 'react';
import classNames from 'classnames';

export default class Checkbox extends React.Component {

    render() {
        const {
            param,
            label,
            filter,
            onChange,
        } = this.props;

        const checked = !!filter[param];
        const labelClass = classNames({
            toggle_switch: true,
            checked
        });
        return (
            <label className={labelClass}>
                <input type="checkbox" name={param} defaultChecked={checked} onChange={onChange} autoComplete="off" />
                <div className="switch"><div className="dot"></div></div>
                <span>{label}</span>
            </label>
        );
    }
}
