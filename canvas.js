export class Canvas {

    canvas;
    context;
    isDrawing;
    lastPosition;
    width;
    height;

    constructor(elementId) {
        this.canvas = $(`#${elementId}`);
        this.setup();
    }

    setup() {
        const htmlCanvas = this.canvas.get(0);
        this.width = htmlCanvas.width = htmlCanvas.clientWidth;
        this.height = htmlCanvas.height = htmlCanvas.clientHeight;
        this.context = htmlCanvas.getContext('2d');
        this.context.strokeStyle = "#000000";
        this.context.lineJoin = "round";
        this.context.lineWidth = 2;
        this.canvas.on('mousedown', this.mouseDown);
        this.canvas.on('mouseup', this.mouseUp);
        this.canvas.on('mousemove', this.mouseMove);
    }

    clear = () => {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    getImageData = () => {
        const imageData = this.context.getImageData(0, 0, this.width, this.height);
        const converted = [];
        const imageSize = this.width * this.height;
        for (let i = 0; i < imageSize; i++) {
            converted.push(imageData.data[(i * 4) + 3] / 255);
        }
        return converted;
    }

    mouseDown = (e) => {
        this.isDrawing = true;
        this.mouseMove(e);
    }

    mouseMove = (e) => {
        if (!this.isDrawing) { return; }
        this.drawPixel(e.offsetX, e.offsetY);
        this.lastPosition = [e.offsetX, e.offsetY];
    }

    mouseUp = (e) => {
        this.isDrawing = false;
        this.lastPosition = null;
    }

    drawPixel = (x, y) => {
        const lastPosition = this.lastPosition || [x - 1, y - 1];
        this.context.beginPath();
        this.context.moveTo(lastPosition[0], lastPosition[1]);
        this.context.lineTo(x, y);
        this.context.stroke();
    }

}
