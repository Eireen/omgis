import React from 'react';
import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../../actions/mapPage';

class OpacityControl extends React.Component {

    state = {
        // Значение, которое отображается в текстовой метке рядом с инпутом, когда пользователь двигает слайдер
        // (при движении слайдера оно отличается от текущего установленного)
        localValue: OpacityControl.MAX_OPACITY_VALUE,
    }

    static get MAX_OPACITY_VALUE() {
        return 1;
    }

    componentDidMount() {
        this.setState({
            localValue: this.props.value,
        });
    }

    componentDidUpdate(prevProps) {
        this.ensureLayerVisibility(prevProps.value);
    }

    ensureLayerVisibility(prevValue) {
        // When changing opacity, check if the layer is visible; if not, show one

        const { value: currentValue } = this.props;

        if (currentValue !== prevValue) {  // Opacity was changed
            this.enableLayer();
        }
    }

    onChange = event => { // движение ползунка
        const { dispatch, layerId } = this.props;

        const opacityNum = +event.target.value;

        this.setState({
            localValue: opacityNum,
        });
    }

    onDragEnd = event => { // отпустили ползунок
        const opacityNum = +event.target.value;

        const { dispatch, layerId } = this.props;

        dispatch(
            mapPageActionCreators.layers.setLayersOpacity({
                [layerId]: opacityNum,
            })
        );
    }

    enableLayer() {
        const {
            layerId, dispatch,
            layersById, references, visibleLayerIds,
        } = this.props;

        if (~visibleLayerIds.indexOf(layerId)) return; // слой уже включён

        dispatch(
            mapPageActionCreators.layers.toggleLayers({
                layerIds: [ layerId ],
                layersById, references, visibleLayerIds,
            })
        );
    }

    render() {
        const { localValue } = this.state;

        return (
            <div className="map_layer_opacity_control">
                <label htmlFor="map_layer_opacity">Прозрачность</label>
                <div className="map_layer_opacity_control_wrap">
                    <input className="" type="range" value={localValue} min="0" max={OpacityControl.MAX_OPACITY_VALUE} step="0.05" autoComplete="off" name="map_layer_opacity" onChange={this.onChange} onMouseUp={this.onDragEnd} onKeyUp={this.onDragEnd} onTouchEnd={this.onDragEnd} />
                    <div className="map_layer_opacity_control_value">{`${Math.round(localValue * 100)}%`}</div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { infoLayerId, opacityByLayerId } = state.mapPage.layers;

    return {
        // ID слоя, инфопанель которого просматривается пользователем в данный момент
        layerId: infoLayerId,
        value: opacityByLayerId[infoLayerId] === undefined
            ? OpacityControl.MAX_OPACITY_VALUE
            : opacityByLayerId[infoLayerId],
        layersById: state.mapPage.layers.layersById,
        references: state.mapPage.layers.references,
        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
    };
}

export default connect(mapStateToProps)(OpacityControl);
