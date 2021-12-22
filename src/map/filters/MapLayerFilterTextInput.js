import React from 'react';
import { connect } from 'react-redux';

class MapLayerFilterTextInput extends React.Component {

    render() {
        const { dbInputConfig, onValueChange } = this.props;
        let { value } = this.props;

        if (value === null || value === undefined) {
            value = '';
        }

        return (
            <textarea className="map_filter_text_input" value={value} placeholder={dbInputConfig.placeholder} required={dbInputConfig.required} onChange={onValueChange} rows="1"></textarea>
        );
    }
}

function mapStateToProps(state) {
    return {};
}

export default connect(mapStateToProps)(MapLayerFilterTextInput);
