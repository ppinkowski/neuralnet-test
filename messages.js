export const TRAIN = 'TRAIN';
export const LOG = 'LOG';
export const TRAINING_STARTED = 'TRAINING_STARTED';
export const TRAINING_FINISHED = 'TRAINING_FINISHED';
export const TRAINING_PERCENT_COMPLETE = 'TRAINING_PERCENT_COMPLETE';
export const TEST_NETWORK = 'TEST_NETWORK';
export const SAVE_STATE = 'SAVE_STATE';
export const TEST_IMAGE = 'TEST_IMAGE';
export const STATE_RECIEVED = 'STATE_RECIEVED';

export const messaging = (worker = self) => {

    const messageHandlers = {};

    const logMessage = (message) => {
        sendTypedMessage(LOG, message);
    }

    const addMessageHandler = (type, callback) => {
        messageHandlers[type] = (messageHandlers[type] || []).concat([callback]);
    }

    const sendTypedMessage = (type, data = undefined) => {
        worker.postMessage({ type, data });
    }

    worker.onmessage = (e) => {
        if (!e.data.type) return;
        const handlers = messageHandlers[e.data.type] || [];
        handlers.forEach(h => h(e.data.data));
    }

    return {
        logMessage,
        addMessageHandler,
        sendTypedMessage
    }
}
