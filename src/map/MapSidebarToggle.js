import React from 'react';

export default class MapSidebarToggle extends React.Component {

    render() {
        return (
            <div className="map_sidebar_toggle" onClick={this.props.onClick}>
                <i className="icn icn_layers"></i>
            </div>
        );
    }
}
