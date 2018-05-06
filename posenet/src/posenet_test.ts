/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
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

import * as tf from '@tensorflow/tfjs-core';

import {PoseNet} from './posenet';

describe('PoseNet', () => {
  let posenet: PoseNet;
  beforeAll((done) => {
    posenet = new PoseNet();

    posenet.load().then(done).catch(done.fail);
  })

  describe('estimateSinglePose', () => {
    it('does not leak memory', done => {
      const image = tf.randomNormal([513, 513, 3]) as tf.Tensor3D;
      const outputStride = 32;

      const beforeTensors = tf.memory().numTensors;

      posenet.estimateSinglePose(image, outputStride)
          .then(() => {
            expect(tf.memory().numTensors).toEqual(beforeTensors);

            image.dispose();
          })
          .then(done)
          .catch(done.fail);
    });
  });

  describe('estimateMultiplePoses', () => {
    it('does not leak memory', done => {
      const image = tf.randomNormal([513, 513, 3]) as tf.Tensor3D;
      const outputStride = 32;

      const beforeTensors = tf.memory().numTensors;
      posenet.estimateMultiplePoses(image, outputStride)
          .then(() => {
            expect(tf.memory().numTensors).toEqual(beforeTensors);

            image.dispose();
          })
          .then(done)
          .catch(done.fail);
    });
  });
})
