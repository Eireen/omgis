import React from 'react';

/* Блок ошибки, который может показываться в составе других блоков
(не только на отдельной странице) */
const ErrorBlock = ({ error, message }) => {
    return (
        <div>
            <h2 className="h2">Ошибка</h2>
            { !!error.status &&
                <p>{error.status}</p>
            }
            <pre>{message || error.message}</pre>
        </div>
    );
}

export default ErrorBlock;
