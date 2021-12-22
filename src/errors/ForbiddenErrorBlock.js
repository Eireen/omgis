import React from 'react';

const ForbiddenErrorBlock = ({ message = 'Вы не имеете доступа к этой странице' }) => (
    <h2 className="h2">{message}</h2>
);

export default ForbiddenErrorBlock;
