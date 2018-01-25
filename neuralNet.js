import { gaussianRand, formatTestResult } from './utils';
import _ from 'lodash';

class NeuralNet {

    weights;
    biases;
    sizes;
    layers;
    logger;
    updateHandler;
    isTraining;
    activation;
    activationDerivative;

    // Pass in the sizes of each layer of the network
    // A layer will be created for each size parameter
    // At least 2 sizes are required for a network - an input
    // and an output layer
    constructor(...sizes) {

        this.sizes = sizes;
        this.layers = sizes.length;

        // weights are initialised for each connection between each neuron in a
        // layer, and each neuron it is connected to in the previous layer. It is
        // represented as an array per layer, with an entry for each neuron.
        // Each of these is an array with an entry for the connection weight to
        // each neuron in the previous layer
        this.weights =_.zip(sizes.slice(1), sizes.slice(0, -1))
            .map(([x, y]) => _.range(x).map(r => _.range(y).map(gaussianRand)));
        
        // biases are initialised for each neuron
        this.biases = sizes.slice(1).map(s => _.range(s).map(gaussianRand));

        this.activation = this.sigmoid;
        this.activationDerivative = this.sigmoidDerivative;
    }

    setLogger(logger) {
        this.logger = logger;
    }

    setUpdateHandler(handler) {
        this.handler = handler;
    }

    // if returnAllLayers is true, return the results of all the layers of the
    // network, not just the last one - we use this for backpropogation
    feedForward = (input, returnAllLayers = false) => {
        const output = [];
        for (let i = 1; i < this.layers; i++) {
            const result = [];
            for (let j = 0; j < this.sizes[i]; j++) {
                // calculate the sum total of each input value * each corresponding weight
                const total = input.reduce((t, v, k) => t + (v * this.weights[i - 1][j][k]), 0);
                // calculate the value for this neuron using the sigmoid function
                result.push(this.activation(total + this.biases[i - 1][j]));
            }
            if (returnAllLayers) {
                output.push(result);
            }
            input = result;
        }
        return returnAllLayers ? output : input;
    }

    // Train the network with the given training data. The network will learn at 
    // the given learning rate for the given number of epochs. The batch size 
    // denotes the size of each mini batch used when performing stochastic gradient
    // descent. If test data is provided the network will evaluate itself with the
    // given test data after each epoch
    train = (data, learningRate = 3, epochs = 10, batchSize = 10, testData = null) => {
        if (this.isTraining) return;
        this.isTraining = true;
        this.logger('Started Training');
        const numBatches = data.length / batchSize;
        for (let i = 0; i < epochs; i++) {
            // shuffle the data so each mini batch is different every epoch
            data = _.shuffle(data);
            for (let j = 0; j < numBatches; j++) {
                // get an initial set of update variables initialised to all zeros
                const { weights, biases } = this.initialiseWeightAndBiasUpdates();
                for (let k = 0; k < batchSize; k++) {
                    // break out of training loop if it has been stopped externally
                    if (!this.isTraining) { return; }
                    const dataIndex = (j * batchSize) + k;
                    // update the weight and bias deltas with the next training sample
                    this.trainOneInput(data[dataIndex], weights, biases);
                    this.handler && this.handler(((dataIndex / data.length * 100) / epochs) + (i * (100 / epochs)));
                }
                // update the actual network weights and biases with the calculated 
                // deltas from this batch, using the learning rate to modify how
                // much to update
                this.updateWeightsAndBiases(weights, biases, learningRate / batchSize);
            }
            // test the network at this point if we have test data
            if (testData) {
                this.logger(formatTestResult(this, testData, `Completed Epoch ${i + 1}, Accuracy: `));
            }
        }
        this.isTraining = false;
        this.logger('Training Completed');
    }

    stopTraining() {
        this.isTraining = false;
    }

    loadNetworkState = ({ weights, biases }) => {
        this.weights = weights;
        this.biases = biases;
    }

    getNetworkState = () => {
        return { weights: this.weights, biases: this.biases };
    }

    // create a collection of new weight and bias updates all initialised to zero
    initialiseWeightAndBiasUpdates = () => {
        const weights = [];
        const biases = [];
        for (let i = 0; i < this.weights.length; i++) {
            weights.push([]);
            biases.push(new Array(this.biases[i].length).fill(0));
            for (let j = 0; j < this.weights[i].length; j++) {
                weights[i].push(new Array(this.weights[i][j].length).fill(0));
            }
        }
        return { weights, biases };
    }
    
    // update the given weights and bias deltas with the result of
    // backpropogation from one training example
    trainOneInput = ([expected, data], weights, biases) => {
        // get the initial forward propogation from this example
        const forwardResult = this.feedForward(data, true);
        // calculate an expected/ideal result
        const expectedResult = this.expectedResult(expected);
        // backpropogate the errors from this run and get the errors
        // for each neuron in the network
        const errorResults = this.backprop(forwardResult, expectedResult);
        // update the weight and bias deltas according the errors calculated above
        this.getWeightsAndBiasesUpdates(data, errorResults, forwardResult, weights, biases);
    }

    // update the actual network weights and biases with the given update deltas
    updateWeightsAndBiases = (weightUpdates, biasUpdates, learningRate) => {
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    this.weights[i][j][k] += (weightUpdates[i][j][k] * learningRate);
                }
                this.biases[i][j] += (biasUpdates[i][j] * learningRate);
            }
        }
    }

    // update the passed in collection of weight and bias updates with the results
    // of the backpropogated error from a forward propogation run for one example
    getWeightsAndBiasesUpdates = (data, errors, forwardResult, weightUpdates, biasUpdates) => {
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    const input = (i === 0) ? data[k] : forwardResult[i - 1][k];
                    weightUpdates[i][j][k] += (errors[i][j] * input);
                }
                biasUpdates[i][j] += errors[i][j];
            }
        }
    }

    // perform backpropogation of the errors in the network for the given forward run
    backprop = (forwardResult, expectedResult) => {
        const errorResults = [];
        for (let i = forwardResult.length - 1; i >= 0; i--) {
            const isOutputLayer = (i === forwardResult.length - 1);
            const errors = forwardResult[i].map((r, j) => {
                const neuronError = isOutputLayer
                    ? this.outputNeuronError(r, expectedResult[j])
                    : this.hiddenNeuronError(r, this.weights[i + 1].map(w => w[j]), errorResults[forwardResult.length - 2 - i]);
                return neuronError;
            });
            errorResults.push(errors);
        }
        return errorResults.reverse();
    }

    // Calculate r^2 error cost of the network for the given example
    calculateCost = (result, expected) => {
        return _.sum(_.zip(result, expected).map(([r, e]) => ((e - r) * (e - r)) / 2));
    }

    // Run an image through the network and return the output
    testImage = (data) => {
        const result = this.feedForward(data);
        const favouredValue = _.max(result);
        return _.indexOf(result, favouredValue);
    }

    // Test the network with the given collection of images, returning
    // the number of correct outputs
    test = (data) => {
        const results = data.map(([v, d]) => [v, this.testImage(d)]);
        return _.sumBy(results, ([expected, actual]) => (expected === actual) ? 1 : 0);
    }

    // The sigmoid activation function
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    // The derivative of a number which has been run
    // through the sigmoid activation function
    sigmoidDerivative(x) {
        return x * (1 - x);
    }

    relu(x) {
        return Math.max(0, x);
    }

    reluDerivative(x) {
        return x > 0 ? 1 : 0;
    }

    // Calculate the error on a neuron in a hidden layer of the network
    // This is the total weighted error of all the neurons in the next 
    // layer that this neuron is connected to
    hiddenNeuronError(output, nextLayerWeights, nextLayerErrors) {
        return nextLayerErrors.reduce((t, e, i) => t + (nextLayerWeights[i] * e), 0) * this.activationDerivative(output);
    }

    // Calculate the error of a neuron in the output layer
    outputNeuronError(output, expected) {
        return (expected - output) * this.activationDerivative(output);
    }

    // Return an expected output result of the network for a given value
    // E.g. for a value of 2, the output should be an array with a 1 at index
    // 2 and zero everywhere else: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
    expectedResult(val) {
        return _.range(10).map((r, i) => (i === val) ? 1 : 0);
    }
}

export default NeuralNet;
