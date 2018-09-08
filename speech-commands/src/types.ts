/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs';

/**
 * This file defines the interfaces related to SpeechCommandRecognizer.
 */

export type FFT_TYPE = 'BROWSER_FFT'|'SOFT_FFT';

export type RecognizerCallback = (result: SpeechCommandRecognizerResult) =>
    Promise<void>;

/**
 * Interface for a speech-command recognizer.
 */
export interface SpeechCommandRecognizer {
  /**
   * Load the underlying model instance and associated metadata.
   *
   * If the model and the metadata are already loaded, do nothing.
   */
  ensureModelLoaded(): Promise<void>;

  /**
   * Start recognition in a streaming fashion.
   *
   * @param callback the callback that will be invoked every time
   *   a recognition result is available.
   * @param options optional configuration.
   * @throws Error if there is already ongoing streaming recognition.
   */
  startStreaming(
      callback: RecognizerCallback,
      config?: StreamingRecognitionConfig): Promise<void>;

  /**
   *  Stop the ongoing streaming recognition (if any).
   *
   * @throws Error if no streaming recognition is ongoing.
   */
  stopStreaming(): Promise<void>;

  /**
   * Check if this instance is currently performing
   * streaming recognition.
   */
  isStreaming(): boolean;

  /**
   * Recognize a single example of audio.
   *
   * @param input tf.Tensor of Float32Array. If a tf.Tensor,
   *     must match the input shape of the underlying
   *     tf.Model. If a Float32Array, the length must be
   *     equal to (the model’s required FFT length) *
   *     (the model’s required frame count).
   * @returns A Promise of recognition result: the probability scores.
   * @throws Error on incorrect shape or length.
   */
  recognize(input: tf.Tensor|
            Float32Array): Promise<SpeechCommandRecognizerResult>;

  /**
   * Get the input shape of the tf.Model the underlies the recognizer.
   */
  modelInputShape(): tf.Shape;

  /**
   * Getter for word labels.
   *
   * The word labels are an alphabetically sorted Array of strings.
   */
  wordLabels(): string[];

  /**
   * Get the parameters such as the required number of frames.
   */
  params(): RecognizerParams;

  /**
   * Create a new recognizer based on this recognizer, for transfer learning.
   *
   * @param name Required name of the transfer learning recognizer. Must be a
   *   non-empty string.
   * @returns An instance of TransferSpeechCommandRecognizer, which supports
   *     `collectExample()`, `train()`, as well as the same `startStreaming()`
   *     `stopStreaming()` and `recognize()` as the base recognizer.
   */
  createTransfer(name: string): TransferSpeechCommandRecognizer;
}

/**
 * Interface for a transfer-learning speech command recognizer.
 *
 * This inherits the `SpeechCommandRecognizer`. It adds methods for
 * collecting and clearing examples for transfer learning, methods for
 * querying the status of example collection, and for performing the
 * transfer-learning training.
 */
export interface TransferSpeechCommandRecognizer extends
    SpeechCommandRecognizer {
  /**
   * Collect an example for transfer learning via WebAudio.
   *
   * @param {string} word Name of the word. Must not overlap with any of the
   *   words the base model is trained to recognize.
   * @returns {SpectrogramData} The spectrogram of the acquired the example.
   * @throws Error, if word belongs to the set of words the base model is
   *   trained to recognize.
   */
  collectExample(word: string): Promise<SpectrogramData>;

  /**
   * Clear all transfer learning examples collected so far.
   */
  clearExamples(): void;

  /**
   * Get counts of the word examples that have been collected for a
   * transfer-learning model.
   *
   * @returns {{[word: string]: number}} A map from word name to number of
   *   examples collected for that word so far.
   */
  countExamples(): {[word: string]: number};

  /**
   * Train a transfer-learning model.
   *
   * The last dense layer of the base model is replaced with new softmax dense
   * layer.
   *
   * It is assume that at least one category of data has been collected (using
   * multiple calls to the `collectTransferExample` method).
   *
   * @param config {TransferLearnConfig} Optional configurations fot the
   *   training of the transfer-learning model.
   * @returns {tf.History} A history object with the loss and accuracy values
   *   from the training of the transfer-learning model.
   * @throws Error, if `modelName` is invalid or if not sufficient training
   *   examples have been collected yet.
   */
  train(config?: TransferLearnConfig): Promise<tf.History>;
}

/**
 * Interface for a snippet of audio spectrogram.
 */
export interface SpectrogramData {
  /**
   * The float32 data for the spectrogram.
   *
   * Stored frame by frame. For example, the first N elements
   * belong to the first time frame and the next N elements belong
   * to the second time frame, and so forth.
   */
  data: Float32Array;

  /**
   * Number of points per frame, i.e., FFT length per frame.
   */
  frameSize: number;
}

/**
 * Interface for a result emitted by a speech-command recognizer.
 *
 * It is used in the callback of a recognizer's streaming or offline
 * recognition method. It represents the result for a short snippet of
 * audio.
 */
export interface SpeechCommandRecognizerResult {
  /**
   * Probability scores for the words.
   */
  scores: Float32Array|Float32Array[];

  /**
   * Optional spectrogram data.
   */
  spectrogram?: SpectrogramData;
}

export interface StreamingRecognitionConfig {
  /**
   * Overlap factor. Must be a number between >=0 and <1.
   * Defaults to 0.5.
   * For example, if the model takes a frame length of 1000 ms,
   * and if overlap factor is 0.4, there will be a 400-ms
   * overlap between two successive frames, i.e., frames
   * will be taken every 600 ms.
   */
  overlapFactor?: number;

  /**
   * Minimum samples of the same label for reliable prediction.
   */
  minSamples?: number;

  /**
   * Amount to time in ms to suppress recognizer after a word is recognized.
   *
   * Defaults to 1000 ms.
   */
  suppressionTimeMillis?: number;

  /**
   * Threshold for the maximum probability value in a model prediction
   * output to be greater than or equal to, below which the callback
   * will not be called.
   *
   * Must be a number >=0 and <=1.
   *
   * If `null` or `undefined`, will default to `0`.
   */
  probabilityThreshold?: number;

  /**
   * Invoke the callback for background noise and unknown.
   *
   * Default: false.
   */
  invokeCallbackOnNoiseAndUnknown?: boolean;

  /**
   * Whether the spectrogram is to be provided in the each recognition
   * callback call.
   *
   * Default: `false`.
   */
  includeSpectrogram?: boolean;
}

/**
 * Configurations for the training of a transfer-learning recognizer.
 *
 * It is used during calls to the `TransferSpeechCommandRecognizer.train()`
 * method.
 */
export interface TransferLearnConfig {
  /**
   * Number of training epochs (default: 20).
   */
  epochs?: number;

  /**
   * Optimizer to be used for training (default: 'sgd').
   */
  optimizer?: string|tf.Optimizer;

  /**
   * Batch size of training (default: 128).
   */
  batchSize?: number;

  /**
   * Validation split to be used during training (default: 0).
   *
   * Must be a number between 0 and 1.
   */
  validationSplit?: number;

  /**
   * tf.Callback to be used during the training.
   */
  callback?: tf.CustomCallbackConfig;
}

/**
 * Parameters for a speech-command recognizer.
 */
export interface RecognizerParams {
  /**
   * Audio sample window size per spectrogram column.
   */
  columnBufferLength?: number;

  /**
   * Audio sample window hopping size between two consecutive spectrogram
   * columns.
   */
  columnHopLength?: number;

  /**
   * Total duration per spectragram, in milliseconds.
   */
  spectrogramDurationMillis?: number;

  /**
   * FFT encoding size per spectrogram column.
   */
  fftSize?: number;

  /**
   * Post FFT filter size for spectorgram column.
   */
  filterSize?: number;

  /**
   * Sampling rate, in Hz.
   */
  sampleRateHz?: number;
}

/**
 * Interface of an audio feature extractor.
 */
export interface FeatureExtractor {
  /**
   * Config the feature extractor.
   */
  setConfig(params: RecognizerParams): void;

  /**
   * Start the feature extraction from the audio samples.
   */
  start(samples?: Float32Array): Promise<Float32Array[]|void>;

  /**
   * Stop the feature extraction.
   */
  stop(): Promise<void>;

  /**
   * Get the extractor features collected since last call.
   */
  getFeatures(): Float32Array[];
}
