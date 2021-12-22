import React from 'react';
import Select from './Select';

export default class ReportType extends React.Component {

    render() {
        const props = Object.assign({
            param: 'reportType',
            label: 'Тип отчёта',
            prompt: '&lt;Не определено&gt;',
            itemLabelField: 'label',
            canBeEmpty: false,
            items: [
                {
                    label: 'Сводный',
                    id: 'total'
                },
                {
                    label: 'Просрочки',
                    id: 'delays'
                }
            ]
        }, this.props);

        return (
            <Select {...props} />
        );
    }
}
