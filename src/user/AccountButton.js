import React from 'react';

const AccountButton = ({ counter }) => {
    return (
        <a href="javascript:" className="icnd_link labeled">
            <span className="icnd_qty">
                <i className="icn icn_user"></i>
                { !!counter &&
                    <span className="_qty">{counter}</span>
                }
            </span>
            <span className="_name">ЛК</span>
        </a>
    );
}

export default AccountButton;
