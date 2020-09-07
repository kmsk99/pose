// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
// the link to your model provided by Teachable Machine export panel 경로
/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

var videoElement = document.querySelector('video');
var audioSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream().then(getDevices).then(gotDevices);

function getDevices() {
  // AFAICT in Safari this only gets default devices until gUM is called :/
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos; // make available to console
  console.log('Available input and output devices:', deviceInfos);
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  return navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  audioSelect.selectedIndex = [...audioSelect.options].
    findIndex(option => option.text === stream.getAudioTracks()[0].label);
  videoSelect.selectedIndex = [...videoSelect.options].
    findIndex(option => option.text === stream.getVideoTracks()[0].label);
  videoElement.srcObject = stream;
}

function handleError(error) {
  console.error('Error: ', error);
}



const URL = "./my_model/";
// 초기 값 설정
let model,
    webcam,
    ctx,
    labelContainer,
    maxPredictions,
    status;

// 클릭버튼 연결된 함수
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata Refer to tmImage.loadFromFiles() in the API to
    // support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 400;
    // const flip = true; // whether to flip the webcam
    // webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    // await webcam.setup(); // request access to the webcam
    // await webcam.play();
    // window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop(timestamp) {
    // webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet estimatePose can take in an image,
    // video or canvas html element
    const {pose, posenetOutput} = await model.estimatePose(videoElement);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i]
            .probability
            .toFixed(2);
        labelContainer
            .childNodes[i]
            .innerHTML = classPrediction;
    }
    // finally draw the poses
    // drawPose(pose);

    // 음성으로 행동 말해주기
    if (prediction[0].probability.toFixed(2) >= 0.99) {
        if (status == "bend" || status == "right" || status == "narrow") {
            status = "prone";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "prone";
    } else if (prediction[1].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "right" || status == "narrow") {
            status = "bend";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "bend"
    } else if (prediction[2].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "bend" || status == "narrow") {
            status = "right";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "right"
    } else if (prediction[3].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "right" || status == "bend") {
            status = "narrow";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "narrow"
    }
}

// function drawPose(pose) {
//     if (webcam.canvas) {
//         ctx.drawImage(webcam.canvas, 0, 0);
//         // draw the keypoints and skeleton
//         if (pose) {
//             const minPartConfidence = 0.5;
//             tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
//             tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
//         }
//     }
// }
