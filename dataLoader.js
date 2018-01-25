const fetchRawData = async (url) => {
    const response = await fetch(url);
    if (response.ok) {
        return new Uint8Array(await response.arrayBuffer());
    }
}

// big endian, because reasons
const byteArrayToInt = (array, start) => {
    var value = 0;
    for (let i = start; i < start + 4; i++) {
        value = (value * 256) + array[i];
    }
    return value;
};

// Load MNIST data and return in a usable format
// return as [[value, [pixelValue]]]
export const fetchData = async (dataUrl = 'data/train-images.idx3-ubyte', labelsUrl = 'data/train-labels.idx1-ubyte') => {
    const [data, labels] = await Promise.all([fetchRawData(dataUrl), fetchRawData(labelsUrl)]);
    const numImages = byteArrayToInt(data, 4);
    const height = byteArrayToInt(data, 8);
    const width = byteArrayToInt(data, 12);
    const imagePixels = width * height;
    const result = [];
    for (let i = 0; i < numImages; i++) {
        const dataItem = [labels[i + 8], []];
        const startIndex = 16 + (i * imagePixels);
        const endIndex = 16 + (i * imagePixels) + imagePixels;
        for (let j = startIndex; j < endIndex; j++) {
            dataItem[1].push(data[j] / 255);
        }
        result.push(dataItem);
    }
    return result;
}

export const fetchVariables = async () => {
    const data = await fetch('data/variables.json');
    return await data.json();
}


