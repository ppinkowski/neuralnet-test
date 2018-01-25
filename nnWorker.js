import 'babel-polyfill';
import { fetchData, fetchNetworkState } from './dataLoader';
import { TRAIN, messaging, TRAINING_STARTED, TRAINING_FINISHED, TRAINING_PERCENT_COMPLETE, TEST_NETWORK, STOP_TRAINING, SAVE_STATE, TEST_IMAGE, STATE_RECIEVED } from './messages';
import NeuralNet from './neuralNet';
import { formatTestResult } from './utils';

const messages = messaging();
let net;
let trainingData;
let testData;
let state;

const loadData = async () => {
    const [ trainingData, testData, state ] = await Promise.all([
        fetchData(),
        fetchData('/data/t10k-images.idx3-ubyte', '/data/t10k-labels.idx1-ubyte'),
        fetchNetworkState()
    ]);
    return { trainingData, testData, state };
}

const init = async () => {
    net = new NeuralNet(28 * 28, 20, 10);
    net.setLogger(messages.logMessage);
    net.setUpdateHandler((update) => messages.sendTypedMessage(TRAINING_PERCENT_COMPLETE, update));
    const data = await loadData();
    trainingData = data.trainingData;
    testData = data.testData;
    state = data.state;
    if (state) {
        net.loadNetworkState(state);
    }
    messages.logMessage('Data Loaded');
}

messages.addMessageHandler(TRAIN, async ({ epochs, learningRate, batchSize }) => {
    messages.sendTypedMessage(TRAINING_STARTED);
    await net.train(trainingData, learningRate, epochs, batchSize, testData);
    messages.sendTypedMessage(TRAINING_FINISHED);
})

messages.addMessageHandler(TEST_NETWORK, () => {
    messages.logMessage(formatTestResult(net, testData, 'Accuracy: '));
})

messages.addMessageHandler(SAVE_STATE, () => {
    const state = net.getNetworkState();
    messages.sendTypedMessage(STATE_RECIEVED, state);
})

messages.addMessageHandler(TEST_IMAGE, (imageData) => {
    messages.logMessage(`Result: ${net.testImage(imageData)}`);
})

init();
