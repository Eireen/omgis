import Select from '../../filters/Select';
import AutocompletedSelect from '../../filters/AutocompletedSelect';
import MapLayerFilterSelectInput from './MapLayerFilterSelectInput';
import MapLayerFilterTextInput from './MapLayerFilterTextInput';
import MapLayerFilterTemporalInput from './MapLayerFilterTemporalInput';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

class MapLayerFilterInput extends React.Component {

    componentsByInputTypeId = {
        select: MapLayerFilterSelectInput,
        text: MapLayerFilterTextInput,
        temporal: MapLayerFilterTemporalInput,
        // duration: MapLayerFilterDurationInput,
    }

    configRefNamesByInputTypeId = {
        select: 'allSelectInputsById',
        text: 'allTextInputsById',
        temporal: 'allTemporalInputsById',
        duration: 'allDurationInputsById',
    }

    render() {
        const {
            inputTypeId, inputId, value = null, onValueChange, inputReferences, required,

            cache, layerId, filterId, // TODO: избавиться от этих параметров - они нужны только для костыльного `cache`
        } = this.props;

        const dbInputConfig = inputReferences[
            this.configRefNamesByInputTypeId[inputTypeId]
        ][inputId];

        let InputComponent;
        if (inputTypeId === 'select' && dbInputConfig.autocomplete) {
            const valueLabel = value !== null && cache[`map_layer_${layerId}_filter_${filterId}_${value}`] || '';
            return (
                <AutocompletedSelect
                    autocompleteUrl={dbInputConfig.options} value={value} valueLabel={valueLabel} required={required}
                    minInputLength={dbInputConfig.autocomplete_min_input}
                    prompt={dbInputConfig.autocomplete_placeholder}
                    onValueChange={onValueChange}
                    classes={{ root: 'map_filter_select_root' }}
                />
            );
        } else {
            InputComponent = this.componentsByInputTypeId[inputTypeId];
        }

        if (!InputComponent) {
            return <p>{`${inputTypeId} ${inputId}`}</p>;
        }

        return (
            <InputComponent dbInputConfig={dbInputConfig} value={value} onValueChange={onValueChange} required={required} />
        );
    }
}

function mapStateToProps(state) {
    return {
        inputReferences: state.mapPage.layers.references,
        cache: state.cache,
    };
}

export default connect(mapStateToProps)(MapLayerFilterInput);
