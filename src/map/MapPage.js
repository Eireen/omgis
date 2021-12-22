import { trackPageView } from '../utils/analytics';
import cx from 'classnames';
import MapCanvas from './MapCanvas';
import MapSidebar from './MapSidebar';
import MapSidebarToggle from './MapSidebarToggle';
import React from 'react';
import store from '../utils/store';

export default class MapPage extends React.Component {

    state = {
        isMapSidebarVisible: true,
    }

    onMapSidebarToggleClick = () => {
        this.setState(prevState => ({
            isMapSidebarVisible: !prevState.isMapSidebarVisible,
        }));
    }

    dynamicContentNode = null  // нода, в которую подгружаются данные - для отправки в аналитику

    componentDidMount() {
        document.title = `Карта`;

        /* Костыль: сохраняем referrer на данный момент, т.к. после рендера меню слоёв может произойти обновление URL
        текущей страницы из-за добавления параметра layers с дефолтными слоями, и предыдущий referrer затрётся */
        this.referrerUrl = store.get('fullReferrerPath');
    }

    registerPageview = loadTime => {
        trackPageView({
            generationTime: loadTime,
            newContent: this.dynamicContentNode,
            referrerUrl: this.referrerUrl,
        });
    }

    refDynamicContent = node => {
        this.dynamicContentNode = node;
    }

    onMapCanvasInit = map => {
        this.map = map;
    }

    render() {
        const { isMapSidebarVisible } = this.state;

        const baseClasses = cx('page_main map_container', { map_sidebar_visible: isMapSidebarVisible });

        return (
            <div className={baseClasses}>
                <div className="page_main" ref={this.refDynamicContent}>
                    {/* to remove */}
                    { /* <MapContainer hasLayerTree="true" hasLocateControl="true" saveCoordsInURL="true" registerPageview={this.registerPageview} /> */ }
                    <MapSidebar />
                    <MapCanvas onInit={this.onMapCanvasInit} hasLocateControl="true" saveCoordsInURL="true" registerPageview={this.registerPageview} />
                    <MapSidebarToggle onClick={this.onMapSidebarToggleClick} />
                </div>
            </div>
        );
    }
}
