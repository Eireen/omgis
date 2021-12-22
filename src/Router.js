import page from 'page';
import React from 'react';

import { ReactComponent as SvgSprite } from './images/svg_sprite.svg';
import PageNotFound from './errors/PageNotFound';
import PageForbidden from './errors/PageForbidden';
import PageError from './errors/PageError';
import MapPageContainer from './map/MapPageContainer';
import { hideGlobalLoader } from './utils/globalLoader';

export default class Router extends React.Component {

    state = {
        component: null,
    }

    routes = {} // TODO

    async componentDidMount() {

        page((ctx, next) => {
            hideGlobalLoader();
            next();
        })

        page('/', async ctx => {
            this.setState({
                component: <MapPageContainer currentUrl={ctx.path} />,
            });
        });

        page('*', ctx => {
            this.setState({ component: <PageNotFound /> });
        });

        page();
    }

    render() {
        return (
            <React.Fragment>
                <SvgSprite />
                {this.state.component}
            </React.Fragment>
        );
    }
}
