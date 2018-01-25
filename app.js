import NeuralNet from './neuralNet';
import { log } from './utils';
import { fetchData } from './dataLoader';

const net = new NeuralNet(28 * 28, 20, 10);

const onButtonClick = (id, onClick) => {
    document.getElementById(id).addEventListener('click', onClick);
}

const loadData = async () => {
    const data = await fetchData();
    const trainingData = data.slice(0, 50000);
    const testData = data.slice(50000, 600000);
    log('Data Loaded');
    return { trainingData, testData };
}

const runNet = async () => {
    const { trainingData, testData } = await loadData();
    onButtonClick('train', () => net.train(trainingData, 3, 2, 10, testData));
    onButtonClick('save', () => net.saveNetworkState());
}

window.onload = runNet;
