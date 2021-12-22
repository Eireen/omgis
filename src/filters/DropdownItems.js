import $ from 'jquery';
import classNames from 'classnames';
import jQueryScrollPane from '../vendor/jquery.jscrollpane/jquery.jscrollpane.min';
import PropTypes from 'prop-types';
import React from 'react';
import withTransition from './withTransition';

class DropdownItems extends React.Component {

    animationDuration = 300

    onItemClick = ({ event, value }) => {
        if (!this.props.onItemClick) return;

        const { param: name } = this.props;

        this.props.onItemClick({ event, name, value });
    }

    render() {
        const { param, items, baseRef } = this.props;

        if (!items) return null;

        return (
            <div className={`page_filter_drop ${param}Filter`} ref={baseRef}>
                <ul>
                    { items.map(item => <DropdownItem {...item} key={item.id} onClick={this.onItemClick} />) }
                </ul>
            </div>
        );
    }
}

class DropdownItem extends React.Component {

    onClick = event => {
        if (this.props.onClick) {
            this.props.onClick({
                event,
                value: this.props.id
            });
        }
    }

    render() {
        const {
            id,
            label,
            classes,
            isSelected,
            defaultUrlParams
        } = this.props;

        let itemProps = {
            'data-value': id,
            onClick: this.onClick,
            className: classNames(...(classes || []), {
                selected: isSelected
            })
        };
        if (defaultUrlParams) {
            itemProps['data-default-url-params'] = JSON.stringify(defaultUrlParams);
        }

        return ( // TODO: попробовать убрать className="needsclick"
            <li {...itemProps}>
                <a href="javascript:" className="needsclick" dangerouslySetInnerHTML={{__html: label}}></a>
            </li>
        );
    }
}

export default withTransition(300, 'isOpened')(DropdownItems);
