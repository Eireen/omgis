import { connect } from 'react-redux';
import { creators as mapPageActionCreators } from '../actions/mapPage';
import cx from 'classnames';
import MapEditPanel from './MapEditPanel';
import MapFilterPanel from './filters/MapFilterPanel';
import MapLayersPanelWrap from './MapLayersPanelWrap';
import React from 'react';

class MapMainMenu extends React.Component {

    componentDidMount() {
        this.props.setInitialItems();
    }

    isPanelContentAvailable(itemId) {
        const handlersByItemId = {
            filter: 'isFiltersPanelAvailable',
            // legend: 'isLegendPanelAvailable',
        };
        if (!handlersByItemId[itemId]) return false;
        return this[handlersByItemId[itemId]]();
    }

    isFiltersPanelAvailable() {
        const { visibleLayerIds, activeFiltersByLayerId, layersById } = this.props;

        if (!visibleLayerIds.length) return false;

        // Проверяем соответствие установленных фильтров включённым слоям (т. к. фильтр не очищается при выключении слоя)
        let visibleLayerHasFilters = false;
        for (let visibleLayerId of visibleLayerIds) {
            visibleLayerHasFilters =
                layersById[visibleLayerId] &&
                layersById[visibleLayerId].filters &&
                layersById[visibleLayerId].filters.length;
            if (visibleLayerHasFilters) {
                break;
            }
        }

        return visibleLayerHasFilters;
    }

    isPanelContentActive(itemId) {
        const handlersByItemId = {
            filter: 'isFiltersPanelActive',
            // legend: 'isLegendPanelActive',
        };
        if (!handlersByItemId[itemId]) return false;
        return this[handlersByItemId[itemId]]();
    }

    isFiltersPanelActive() {
        // Флаг активности фильтров - когда пользователь применил свою фильтрацию
        // (отличную от пустых и дефолтных значений)

        const { visibleLayerIds, activeFiltersByLayerId } = this.props;

        if (!visibleLayerIds.length) return false;

        // Проверяем соответствие установленных фильтров включённым слоям (т. к. фильтр не очищается при выключении слоя)
        let filteredLayerInVisible = false;
        for (let filteredLayerId in activeFiltersByLayerId) {

            // Если в фильтре данного слоя только пустой слот или дефолтные значения, не ставим флаг активности
            const orGroups = activeFiltersByLayerId[filteredLayerId];
            if (!orGroups || orGroups[0][0].filterId === null || this.isDefaultFilterValue(filteredLayerId)) {
                continue;
            }

            if (~visibleLayerIds.indexOf(+filteredLayerId)) {
                filteredLayerInVisible = true;
                break;
            }
        }

        return filteredLayerInVisible;
    }

    isDefaultFilterValue(layerId) {
        // Проверка, установлены ли в фильтре только дефолтные значения
        // TODO
    }

    render() {
        const { items, activeId, onItemClick } = this.props;

        return (
            <div className="map_main_menu">
                <ul className="scrollable">
                    {items.map(item => <MapMainMenuItem
                        {...item}
                        active={activeId === item.id}
                        addAvailableHighlight={this.isPanelContentAvailable(item.id)}
                        addActiveHighlight={this.isPanelContentActive(item.id)}
                        onClick={onItemClick}
                        key={item.id} />
                    )}
                </ul>
            </div>
        );
    }
}

class MapMainMenuItem extends React.Component {

    onClick = event => {
        const { onClick: outerHandler, id: itemId } = this.props;

        if (outerHandler) {
            outerHandler({ event, itemId });
        }
    }

    render() {
        const { id, label, icon, active, disabled, addAvailableHighlight = false, addActiveHighlight = false } = this.props;

        const classes = cx('map_main_menu_item', {
            map_main_menu_item_active: active,
            map_main_menu_item_disabled: disabled,
        });

        let labelClasses = cx('map_main_menu_item_label', {
            // map_main_menu_item_label_highlight: addAvailableHighlight || addActiveHighlight,  // TMP DISABLED
        });

        if (addActiveHighlight) {
            labelClasses = cx(labelClasses, {
                // map_main_menu_item_label_highlight_active: addActiveHighlight,  // TMP DISABLED
            });
        } else if (addAvailableHighlight) {
            labelClasses = cx(labelClasses, {
                // map_main_menu_item_label_highlight_available: addAvailableHighlight,  // TMP DISABLED
            });
        }

        return (
            <li className={classes} title={label} onClick={disabled ? null : this.onClick}>
                <label className={labelClasses}>
                    <div className="map_main_menu_item_icon">
                        <i className={`icn ${icon}`}></i>
                    </div>
                    <div className="map_main_menu_item_label_text">{label}</div>
                </label>
            </li>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeId: state.mapPage.mainMenu.activeItemId,
        items: state.mapPage.mainMenu.items,

        visibleLayerIds: state.mapPage.layers.visibleLayerIds,
        activeFiltersByLayerId: state.mapPage.filter.filtersByLayerId,
        layersById: state.mapPage.layers.layersById,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setInitialItems: function() {
            dispatch(
                mapPageActionCreators.mainMenu.setItems([
                    {
                        id: 'layers',
                        label: 'Слои',
                        icon: 'icn_layers_navy',
                        content: MapLayersPanelWrap,
                    },
                    {
                        id: 'filter',
                        label: 'Фильтры',
                        icon: 'icn_filter_navy',
                        content: MapFilterPanel,
                        disabled: true,
                    },
                    {
                        id: 'edit',
                        label: 'Рисование',
                        icon: 'icn_pencil_navy',
                        content: MapEditPanel,
                        disabled: true,
                    },
                    {
                        id: 'legend',
                        label: 'Легенда',
                        icon: 'icn_information_circle_navy',
                        disabled: true,
                    },
                    {
                        id: 'stats',
                        label: 'Статистика',
                        icon: 'icn_bar_chart_navy',
                        disabled: true,
                    },
                    {
                        id: 'bookmarks',
                        label: 'Закладки',
                        icon: 'icn_star_navy',
                        disabled: true,
                    },
                ])
            );
        },
        onItemClick: function ({ itemId }) {
            dispatch(
                mapPageActionCreators.mainMenu.setActiveItemId(itemId)
            );
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MapMainMenu);
