import 'babel-polyfill';
import NeuralNet from './neuralNet';
import { log, formatTestResult } from './utils';
import { fetchData, fetchNetworkState } from './dataLoader';
import { Canvas } from './canvas';
import download from 'downloadjs';
import { messaging, LOG, TRAIN, TRAINING_STARTED, TRAINING_FINISHED, TRAINING_PERCENT_COMPLETE, TEST_NETWORK, SAVE_STATE, TEST_IMAGE, STATE_RECIEVED } from './messages';

const onButtonClick = (id, onClick) => {
    document.getElementById(id).addEventListener('click', onClick);
}

const inputVal = (id) => {
    return $(`#${id}`).val();
}

let nnMessaging;

const runNet = async () => {
    const canvas = new Canvas('inputCanvas');
    onButtonClick('train', () => nnMessaging.sendTypedMessage(TRAIN, {
        epochs: inputVal('epochs'),
        learningRate: inputVal('learningRate'),
        batchSize: inputVal('batchSize')
    }));
    onButtonClick('save', () => nnMessaging.sendTypedMessage(SAVE_STATE));
    onButtonClick('test', () => nnMessaging.sendTypedMessage(TEST_NETWORK));
    onButtonClick('testImage', () => {
        const imageData = canvas.getImageData();
        nnMessaging.sendTypedMessage(TEST_IMAGE, imageData);
    });
    onButtonClick('clearImage', () => canvas.clear());
    onButtonClick('stop', () => nnMessaging.sendTypedMessage(STOP_TRAINING));
    const nnWorker = new Worker('/build/nnWorker.js');
    nnMessaging = messaging(nnWorker);
    nnMessaging.addMessageHandler(LOG, log);
    nnMessaging.addMessageHandler(TRAINING_STARTED, () => {
        $('#train').prop('disabled', true);
        $('#trainProgress').removeClass('hidden');
    });
    nnMessaging.addMessageHandler(TRAINING_FINISHED, () => {
        $('#train').prop('disabled', false);
        $('#trainProgress').addClass('hidden');
    });
    nnMessaging.addMessageHandler(TRAINING_PERCENT_COMPLETE, (v) => {
        $('#trainProgress > span:first-child').text(`${Math.round(v * 100) / 100}%`);
    });
    nnMessaging.addMessageHandler(STATE_RECIEVED, (state) => {
        const json = JSON.stringify(state);
        download(json, 'network.json', 'application/json');
    })
}

window.onload = runNet;
