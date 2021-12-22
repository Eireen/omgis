import React from 'react';
import SolidImage from './SolidImage';

/* Scalable sprite icon */

/* Thanks to:
    - http://responsive-css.spritegen.com/ (for the idea of an auto-scalable dataUrl image placeholder)
    - https://stackoverflow.com/questions/21810262/responsive-sprites-percentages
*/

export default class ResponsiveSpriteIcon extends React.Component {

    state = {
        imageDataUrl: null,
    }

    componentDidMount() {
        this.createImage(this.props);
    }

    componentWillReceiveProps(nextProps) {
        const availableProps = ['width', 'height', 'color', 'format', 'className'];

        let propChanged = false;
        for (let prop of availableProps) {
            if (nextProps[prop] !== this.props[prop]) {
                propChanged = true;
                break;
            }
        }

        if (propChanged) this.createImage(nextProps);
    }

    createImage(props) {
        const {
            width,
            height,
            color = 'rgba(0,0,0,0)',
            format = 'image/png',
            className,
        } = props;

        const imageDataUrl = SolidImage.create({ width, height, color, format });

        this.setState({ imageDataUrl });
    }

    render() {
        const { className } = this.props;
        const { imageDataUrl } = this.state;

        return (
            !!imageDataUrl && <img className={className} src={imageDataUrl} />
        );
    }
}