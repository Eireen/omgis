import React from 'react';

const NotFoundErrorBlock = ({ message = 'Страница не найдена' }) => (
    <h2 className="h2">{message}</h2>
);

export default NotFoundErrorBlock;
