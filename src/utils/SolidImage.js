/* Генерируемое изображение заданных размера и цвета */

let canvas;
let canvasCtx;

export default class SolidImage {

    static _createCanvas() {
        /* https://stackoverflow.com/questions/5845238/javascript-generate-transparent-1x1-pixel-in-dataurl-format */

        canvas = document.createElement('canvas');

        // http://code.google.com/p/explorercanvas/wiki/Instructions#Dynamically_created_elements
        if (!canvas.getContext) G_vmlCanvasManager.initElement(canvas);

        canvasCtx = canvas.getContext('2d');
    }

    static getCanvas() {
        if (!canvas) {
            SolidImage._createCanvas();
        }
        return canvas;
    }

    static setCanvasSize({ width, height }) {
        canvas.width = width;
        canvas.height = height;
    }

    static create({ width, height, color = 'rgba(0,0,0,0)', format = 'image/png' }) {
        const canvas = SolidImage.getCanvas();
        SolidImage.setCanvasSize({ width, height });

        const ctx = canvasCtx;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);

        return canvas.toDataURL(format);
    }
}