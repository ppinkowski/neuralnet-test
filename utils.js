let output;

const getOutput = () => {
    if (!output) {
        output = document.getElementById('output');
    }
    return output;
}

export const log = (text) => {
   getOutput().value += (text + '\n');
}

export const renderImage = (data) => {
    const container = document.getElementById('imageContainer');
    const canvas = container.appendChild(document.createElement('canvas'));
    const context = canvas.getContext('2d');
    canvas.width = 28;
    canvas.height = 28;
    const imageArray = new Uint8ClampedArray(28 * 28 * 4);
    for (let i = 0; i < data[1].length; i++) {
        imageArray[(i * 4) + 0] = data[1][i] * 255;
        imageArray[(i * 4) + 1] = data[1][i] * 255;
        imageArray[(i * 4) + 2] = data[1][i] * 255;
        imageArray[(i * 4) + 3] = 255;
    }
    const imageData = new ImageData(imageArray, 28, 28);
    context.putImageData(imageData, 0, 0);
    const label = container.appendChild(document.createElement('span'));
    label.innerText = data[0];
}

export const gaussianRand = () => {
    var rand = 0;
    for (var i = 0; i < 6; i += 1) {
        rand += Math.random();
    }
    return ((rand / 6) * 5) - 2.5;
}
