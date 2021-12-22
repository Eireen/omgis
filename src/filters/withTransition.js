import React from 'react';
import Velocity from 'velocity-animate';
import { Transition } from 'react-transition-group';
import $ from 'jquery';
import jQueryScrollPane from '../vendor/jquery.jscrollpane/jquery.jscrollpane.min';

export default function withTransition(animationDuration, isOpenProp = 'isOpen') {
    return function(WrappedComponent) {
        return class extends React.Component {

            dropdownRef = React.createRef()

            render() {
                return (
                    <Transition
                        in={this.props[isOpenProp]}
                        timeout={0}
                        nodeRef={this.dropdownRef}
                        onEnter={() => {
                            // Velocity(this.dropdownRef.current, 'slideDown', { duration: animationDuration });

                            const baseNode = this.dropdownRef.current;

                            Velocity(baseNode, 'slideDown', {
                                duration: this.animationDuration,
                                complete: () => {
                                    if (!baseNode || document.body.clientWidth <= 950) return;

                                    const list = baseNode.querySelector('ul');
                                    const listParent = list.parentElement;

                                    const listParentStyle = window.getComputedStyle(listParent, null);
                                    const listParentHeightWithoutPaddings = listParent.clientHeight
                                        - parseFloat(listParentStyle.paddingTop)
                                        - parseFloat(listParentStyle.paddingBottom);

                                    const needScroll = list.scrollHeight > listParentHeightWithoutPaddings + 1; // 1 - костыльный припуск от лишних скроллов
                                    if (needScroll) {
                                        $(baseNode.querySelector('ul')).jScrollPane({
                                            contentWidth: '0px', // disable horizontal scroll; thanks to https://stackoverflow.com/a/9632415
                                            verticalDragMinHeight: 24,
                                        });
                                    }
                                }
                            });
                        }}
                        onExit={() => {
                            Velocity(this.dropdownRef.current, 'slideUp', { duration: animationDuration });
                        }}
                        mountOnEnter
                    >
                        <WrappedComponent {...this.props} baseRef={this.dropdownRef} />
                    </Transition>
                );
            }
        };
    };
}