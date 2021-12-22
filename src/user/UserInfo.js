import React from 'react';

export default ({ onClick }) => {
    return (
        <div className="page_header_userplace logged">
            <a href="javascript:" title="Выйти" className="logout-link" onClick={onClick}>
                <i className="icn icn_exit"></i>
            </a>
        </div>
    );
}
