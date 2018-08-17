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

import {BrowserFftSpeechCommandRecognizer} from './browser_fft_recognizer';
import {FFT_TYPE, SpeechCommandRecognizer} from './types';

/**
 * Create an instance of speech-command recognizer.
 *
 * @param fftType Type of FFT. The currently availble option(s):
 *   - BROWSER_FFT: Obtains audio spectrograms using browser's native Fourier
 *     transform.
 * @returns An instance of SpeechCommandRecognizer.
 * @throws Error on invalid value of `fftType`.
 */
export function create(fftType: FFT_TYPE): SpeechCommandRecognizer {
  if (fftType === 'BROWSER_FFT') {
    return new BrowserFftSpeechCommandRecognizer();
  } else if (fftType === 'SOFT_FFT') {
    throw new Error(
        'SOFT_FFT SpeechCommandRecognizer has not been implemented yet.');
  } else {
    throw new Error(`Invalid fftType: '${fftType}'`);
  }
}

// tslint:disable-next-line:max-line-length
export {FFT_TYPE, RecognizerConfigParams, SpectrogramData, SpeechCommandRecognizerResult, StreamingRecognitionConfig} from './types';