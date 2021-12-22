import React from 'react';
import Select from './Select';

export default class Dwelling extends React.Component {

    render() {
        const props = Object.assign({
            param: 'dwelling',
            prompt: 'Все',
            itemLabelField: 'label',
            viewTemplate: 'radioList',
            items: [
                {
                    label: 'Жилье',
                    id: '1'
                },
                {
                    label: 'Нежилье',
                    id: '0'
                }
            ]
        }, this.props);

        return (
            <Select {...props} />
        );
    }
}
