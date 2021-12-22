import { creators as mapPageActionCreators } from '../../actions/mapPage';
import ClosePopupButton from './ClosePopupButton';
import Coords from './Coords';
import update from 'immutability-helper';
import React from 'react';
import { connect } from 'react-redux';

class MapPointPopup extends React.Component {

    state = {
        position: {
            top: 0,
            left: 0,
        },
    }

    baseNodeRef = React.createRef()

    componentDidMount() {
        this.updatePosition();

        // this.adjustVerticalPosition();
    }

    componentDidUpdate(prevProps) {
        if (this.needUpdatePosition(prevProps)) {
            this.updatePosition();
        }

        // this.adjustVerticalPosition();
    }

    needUpdatePosition(prevProps) {
        const diffPropNames = [ 'mapCanvasSize', 'pointDetails' ];
        
        for (let propName of diffPropNames) {
            if (prevProps[propName] !== this.props[propName]) {
                return true;
            }
        }

        return false;
    }

    updatePosition() {
        const { mapCanvasSize, pointDetails: { popup, coords } } = this.props;

        if (!popup.isVisible || !coords) return;

        const { pixel: { relative: pointPixelCoords } } = coords;

        const popupMaxWidth = 405;
        const paddingRight = 50;
        const paddingLeft = 10;
        const gapBetweenPointAndPopup = 40;

        const newPosition = {
            top: pointPixelCoords.y - 68,
            left: pointPixelCoords.x + gapBetweenPointAndPopup,
        };

        // Если попап не влезает справа от точки, ставим его слева
        if (mapCanvasSize.width - pointPixelCoords.x - paddingRight < popupMaxWidth) {
            newPosition.left = pointPixelCoords.x - gapBetweenPointAndPopup - popupMaxWidth;
        }

// console.log('calc');console.log(newPosition);

        this.setState(prevState => update(prevState, {
            position: { $set: newPosition },
        }), () => {
            this.adjustVerticalPosition(newPosition);
        });
    }

    adjustVerticalPosition(position) {
        const { mapCanvasSize, pointDetails: { popup, coords } } = this.props;

        if (!popup.isVisible || !coords) return;

        // const { position } = this.state;

// console.log('adjust');console.log(position);

        let popupHeight = this.baseNodeRef.current.scrollHeight;
        const topPadding = 10;
        const bottomPadding = 10;
        const newPosition = { ...position };
        const customContentStyle = { ...popup.contentStyle };

        // Check popup height overflow
        if (popupHeight > mapCanvasSize.height - topPadding - bottomPadding) {
            // Popup height is too big; need shortening
            popupHeight = mapCanvasSize.height - topPadding - bottomPadding;
            customContentStyle.maxHeight = `${popupHeight - 40 - 41}px`;
        } else {
            // Popup height fits within limits; remove maxHeight
            delete customContentStyle.maxHeight;
        }

        // Check top limit
        if (newPosition.top < topPadding) {
            newPosition.top = topPadding;
        }

        // Check bottom limit
        if (newPosition.top + popupHeight > mapCanvasSize.height - bottomPadding) {
            newPosition.top = mapCanvasSize.height - bottomPadding - popupHeight;
        }

        if (newPosition.top !== position.top || newPosition.left !== position.left) {
            this.setState(prevState => update(prevState, {
                position: { $set: newPosition },
            }));
        }

        if (customContentStyle.maxHeight !== popup.contentStyle.maxHeight) {
            this.props.dispatch(
                customContentStyle.maxHeight !== undefined
                    ? mapPageActionCreators.pointDetails.setPopupContentStyle(customContentStyle)
                    : mapPageActionCreators.pointDetails.clearPopupContentStyle()
            );
        }
    }

    render() {
        const { pointDetails: { popup, coords } } = this.props;

        if (!popup.isVisible || !coords) return null;

        const { position } = this.state;

        return (
            <div className="map_point_popup" style={{ ...position }} ref={this.baseNodeRef}>
                <div className="map_point_popup_header">
                    <Coords />
                    <ClosePopupButton />
                </div>
                {/*<div className="map_point_popup_content" dangerouslySetInnerHTML={{ __html: popup.content }}></div>*/}
                <div className="map_point_popup_content" style={{ ...popup.contentStyle }}>
                    <div className="map_point_search_results">
                        <div className="map_point_search_results_header">
                            Результаты поиска (10)
                        </div>
                        <div className="map_point_search_results_list">
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Кастелламаре
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (основной)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Энца
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (второстепенный)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Трастевере
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (второстепенный)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Дора-Бальтеа
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (основной)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Авентино
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (основной)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Тальяменто
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (второстепенный)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Стура-дель-Монферрато
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (второстепенный)
                                </div>
                            </div>
                            <div className="map_point_search_results_list_item">
                                <div className="map_point_search_results_list_item_label">
                                    Мелла
                                </div>
                                <div className="map_point_search_results_list_item_type">
                                    Судовой ход (второстепенный)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="map_point_popup_toolbar">
                    <button type="button" title="Погода" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_sun_navy"></i>
                    </button>
                    <button type="button" title="Восход/заход солнца" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_sunrise_navy"></i>
                    </button>
                    <button type="button" title="Маринограмма" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_line_chart_navy"></i>
                    </button>
                    <button type="button" title="Профиль высот" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_chart_filled_navy"></i>
                    </button>
                    <button type="button" title="Измерить расстояние" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_ruler_navy"></i>
                    </button>
                    <button type="button" title="Измерить площадь" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_square_measurement_navy"></i>
                    </button>
                    <button type="button" title="Фотопанорама" className="map_point_popup_toolbar_button" disabled>
                        <i className="icn icn_panoramic_view_navy"></i>
                    </button>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        pointDetails: state.mapPage && state.mapPage.pointDetails,
        mapCanvasSize: state.mapPage && state.mapPage.mapCanvas.size,
    };
}

export default connect(mapStateToProps)(MapPointPopup);
