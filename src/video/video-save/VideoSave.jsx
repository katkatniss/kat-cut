import PropTypes from "prop-types";
import AudioTrackMixer from "audio-track-mixer";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { closeLoading, loading, secondToTimeFormat } from "../Utils.js";
import { useRef, createElement, useEffect } from "react";

const topImages = {};
const bottomImages = {};

function VideoSave({ videoDatas, drawDatas }) {
  const videoSaveRef = useRef(null);
  const drawTopRef = useRef(null);
  const drawBottomRef = useRef(null);
  const recordRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  const canvas_width = 1280 / 2;
  const canvas_height = 720;

  const getImageFromVideoBySecond = (video, second, canvas, images) => {
    video.currentTime = second;
    let ctx = canvas.getContext('2d');
    return new Promise((resolve) => {
      setTimeout(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        images[video.currentTime] = canvas.toDataURL('image/jpeg');
        resolve();
      }, 100);
    });
  };
  useEffect(() => {
    const drawTopCanvas = drawTopRef.current;
    drawTopCanvas.width = canvas_width;
    drawTopCanvas.height = canvas_height / 2;
    const drawBottomCanvas = drawBottomRef.current;
    drawBottomCanvas.width = canvas_width;
    drawBottomCanvas.height = canvas_height / 2;

    const vTop = topRef.current;
    const vBottom = bottomRef.current;

    const fps = 1000 / 30 / 1000;

    vTop.addEventListener('loadedmetadata', async () => {
      let s = 0;

      while (s <= vTop.duration) {
        await getImageFromVideoBySecond(vTop, s, drawTopCanvas, topImages);
        s += fps;
      }
    });

    vBottom.addEventListener('loadedmetadata', async () => {
      let s = 0;

      while (s <= vBottom.duration) {
        await getImageFromVideoBySecond(vBottom, s, drawBottomCanvas, bottomImages);
        s += fps;
      }
    });

  }, []);

  return (
    <>
      <div ref={videoSaveRef} style={{ height: '7vh' }}>
        <button onClick={() => save(videoDatas, drawDatas, videoSaveRef, topImages, bottomImages, recordRef)} className={'videoButtonEle'}>SAVE</button>
      </div>
      <video controls="controls" ref={topRef} preload={'auto'} muted={true} style={{ display: 'none' }}>
        <source src={videoDatas.videoTop.uri} type={'video/mp4'} />
      </video>
      <video controls="controls" ref={bottomRef} preload={'auto'} muted={true} style={{ display: 'none' }}>
        <source src={videoDatas.videoBottom.uri} type={'video/mp4'} />
      </video>
      <canvas ref={drawTopRef} style={{ display: 'none' }}></canvas>
      <canvas ref={drawBottomRef} style={{ display: 'none' }}></canvas>
      <canvas id="canvas" ref={recordRef} style={{ display: 'none' }}></canvas>
    </>
  );
}

const save = async (videoDatas, drawDatas, videoSaveRef, topImages, bottomImages, recordRef) => {
  loading();
  const vsRef = videoSaveRef.current;
  const topS = videoDatas.videoTop.trimStart;
  const botS = videoDatas.videoBottom.trimStart;
  let topE = videoDatas.videoTop.trimEnd;
  let botE = videoDatas.videoBottom.trimEnd;

  let finalDuration = 0;
  if (topE - topS < botE - botS) {
    finalDuration = topE - topS;
    botE = botS + finalDuration;
  } else {
    finalDuration = botE - botS;
    topE = topS + finalDuration;
  }

  const canvas_width = 1280 / 2;
  const canvas_height = 720;

  const canvas = recordRef.current;
  canvas.height = canvas_height;
  canvas.width = canvas_width;
  const context = canvas.getContext('2d');
  const st = canvas.captureStream(30);

  const chunks = [];
  //Video
  // Create media recorder from canvas stream
  media.media_recorder = new MediaRecorder(st, { mimeType: "video/mp4; codecs=vp9" });
  // Record data in chunks array when data is available
  media.media_recorder.ondataavailable = (evt) => { chunks.push(evt.data); };
  // Provide recorded data when recording stops
  media.media_recorder.onstop = () => { media.on_media_recorder_stop(chunks); }
  // Start recording using a 1s timeslice [ie data is made available every 1s)
  media.media_recorder.start(1000);



  const drawImages = (topImages, bottomImages) => {
    Object.keys(topImages).forEach((key) => {

    });
    const keys = Object.keys(topImages);
    const keyLength = keys.length;
    return new Promise((resolve) => {
      for (let i = 0; i < keyLength; i++) {
        const idx = i;
        setTimeout(() => {
          const k = keys[idx];
          const img = myCreateElement('img', vsRef);
          img.src = topImages[k];
          const img2 = myCreateElement('img', vsRef);
          img2.src = bottomImages[k];
          context.drawImage(img, 0, 0, canvas_width, canvas_height / 2);
          context.drawImage(img2, 0, canvas_height / 2, canvas_width, canvas_height / 2);
          if (idx === keyLength - 1) {
            resolve();
          }
        }, 1000 / 30);
      }
    });
  }

  drawImages(topImages, bottomImages).then(() => {
    media.media_recorder.stop();
    closeLoading();
  });



  //Audio
  // const atm = new AudioTrackMixer();
  // if (!videoDatas.videoTop.mute) {
  //   atm.addTrack(videoTopEl.captureStream(30).getAudioTracks()[0]);
  // }
  // if (!videoDatas.videoBottom.mute) {
  //   atm.addTrack(videoBottomEl.captureStream(30).getAudioTracks()[0]);
  // }

  // st.addTrack(atm.getMixedTrack());
}

const drawVideo = ($this, context, e, drawDatas, canvas_width, canvas_height, x, y) => {
  setTimeout(() => {
    (function loop() {
      if (!$this.paused && !$this.ended) {
        let key = secondToTimeFormat($this.currentTime);
        let c = drawDatas[key];
        if (c) {
          context.drawImage(c, 0, 0, canvas_width, canvas_height);
          delete c[key];
        }

        context.drawImage($this, x, y, canvas_width, canvas_height / 2);

        if ($this.currentTime >= e) {
          $this.pause();
        } else {
          setTimeout(loop, 1000 / 30); // drawing at 30fps
        }
      }
    })();
  }, 0);
}

const myCreateElement = (tag, vsRef, attr = {}, style = { display: 'none' }) => {
  const ele = document.createElement(tag);
  Object.assign(ele, attr);
  Object.assign(ele.style, style);
  vsRef.append(ele);
  return ele;
}

const media = {
  on_media_recorder_stop: function (chunks) {
    media.media_recorder = null;

    // Gather chunks of video data into a blob and create an object URL
    var blob = new Blob(chunks, { type: "video/mp4" });
    const recording_url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style = "display: none;";
    a.href = recording_url;
    a.download = "video.mp4";
    document.body.appendChild(a);

    // Trigger the file download
    a.click();

    closeLoading();

    setTimeout(() => {
      // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
      URL.revokeObjectURL(recording_url);
      document.body.removeChild(a);
    }, 0);
    // const _arrBytes = [];
    // readFileAsync(new Blob(chunks, { type: "video/mp4" }))
    //   .then((byteArray1) => {
    //     _arrBytes.push(byteArray1);
    //     readFileAsync(new Blob(chunks2, { type: "video/mp4" }))
    //       .then((byteArray2) => {
    //         _arrBytes.push(byteArray2);

    //         const recording_url = URL.createObjectURL(combineWavsBuffers(_arrBytes));
    //         // Attach the object URL to an <a> element, setting the download file name
    //         const a = document.createElement('a');
    //         a.style = "display: none;";
    //         a.href = recording_url;
    //         a.download = "video.mp4";
    //         document.body.appendChild(a);

    //         // Trigger the file download
    //         a.click();

    //         setTimeout(() => {
    //           // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
    //           URL.revokeObjectURL(recording_url);
    //           document.body.removeChild(a);
    //         }, 0);
    //       });
    //   });



  },
};
function readFileAsync(blob) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.addEventListener("loadend", function () {
      resolve(reader.result);
    });

    reader.onerror = reject;

    reader.readAsArrayBuffer(blob);
  })
}

function combineWavsBuffers(bufferArray) {

  if (bufferArray.length > 0) {
    var _bufferLengths = bufferArray.map(buffer => buffer.byteLength);

    // Getting sum of numbers
    var _totalBufferLength = _bufferLengths.reduce(function (a, b) {
      return a + b;
    }, 0);

    var tmp = new Uint8Array(_totalBufferLength);

    //Get buffer1 audio data to create the new combined wav
    var audioData = getAudioData.WavHeader.readHeader(new DataView(bufferArray[0])) || {};
    var _bufferLength = 0;
    bufferArray.forEach((buffer) => {
      //Combine array bytes of original wavs buffers.
      tmp.set(new Uint8Array(buffer), _bufferLength);

      _bufferLength += buffer.byteLength;
    });

    //Send combined buffer and send audio data to create the audio data of combined
    var arrBytesFinal = getWavBytes(tmp, {
      isFloat: false,       // floating point or 16-bit integer
      numChannels: audioData.channels,
      sampleRate: audioData.sampleRate,
    });

    //Create a Blob as Base64 Raw data with audio/wav type
    return new Blob([tmp], { type: 'video/mp4; codecs=vp9' });
  }
  return null;
}

// Returns Uint8Array of WAV bytes
function getWavBytes(buffer, options) {
  const type = options.isFloat ? Float32Array : Uint16Array
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT

  const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }))
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0)
  wavBytes.set(new Uint8Array(buffer), headerBytes.length)

  return wavBytes
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
function getWavHeader(options) {
  const numFrames = options.numFrames
  const numChannels = options.numChannels || 2
  const sampleRate = options.sampleRate || 44100
  const bytesPerSample = options.isFloat ? 4 : 2
  const format = options.isFloat ? 3 : 1

  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = numFrames * blockAlign

  const buffer = new ArrayBuffer(44)
  const dv = new DataView(buffer)

  let p = 0

  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i))
    }
    p += s.length
  }

  function writeUint32(d) {
    dv.setUint32(p, d, true)
    p += 4
  }

  function writeUint16(d) {
    dv.setUint16(p, d, true)
    p += 2
  }

  writeString('RIFF')              // ChunkID
  writeUint32(dataSize + 36)       // ChunkSize
  writeString('WAVE')              // Format
  writeString('fmt ')              // Subchunk1ID
  writeUint32(16)                  // Subchunk1Size
  writeUint16(format)              // AudioFormat
  writeUint16(numChannels)         // NumChannels
  writeUint32(sampleRate)          // SampleRate
  writeUint32(byteRate)            // ByteRate
  writeUint16(blockAlign)          // BlockAlign
  writeUint16(bytesPerSample * 8)  // BitsPerSample
  writeString('data')              // Subchunk2ID
  writeUint32(dataSize)            // Subchunk2Size

  return new Uint8Array(buffer)
}

function getAudioData() {


  function WavHeader() {
    this.dataOffset = 0;
    this.dataLen = 0;
    this.channels = 0;
    this.sampleRate = 0;
  }

  function fourccToInt(fourcc) {
    return fourcc.charCodeAt(0) << 24 | fourcc.charCodeAt(1) << 16 | fourcc.charCodeAt(2) << 8 | fourcc.charCodeAt(3);
  }

  WavHeader.RIFF = fourccToInt("RIFF");
  WavHeader.WAVE = fourccToInt("WAVE");
  WavHeader.fmt_ = fourccToInt("fmt ");
  WavHeader.data = fourccToInt("data");

  WavHeader.readHeader = function (dataView) {
    var w = new WavHeader();

    var header = dataView.getUint32(0, false);
    if (WavHeader.RIFF != header) {
      return;
    }
    var fileLen = dataView.getUint32(4, true);
    if (WavHeader.WAVE != dataView.getUint32(8, false)) {
      return;
    }
    if (WavHeader.fmt_ != dataView.getUint32(12, false)) {
      return;
    }
    var fmtLen = dataView.getUint32(16, true);
    var pos = 16 + 4;
    switch (fmtLen) {
      case 16:
      case 18:
        w.channels = dataView.getUint16(pos + 2, true);
        w.sampleRate = dataView.getUint32(pos + 4, true);
        break;
      default:
        throw 'extended fmt chunk not implemented';
    }
    pos += fmtLen;
    var data = WavHeader.data;
    var len = 0;
    while (data != header) {
      header = dataView.getUint32(pos, false);
      len = dataView.getUint32(pos + 4, true);
      if (data == header) {
        break;
      }
      pos += (len + 8);
    }
    w.dataLen = len;
    w.dataOffset = pos + 8;
    return w;
  };

  getAudioData.WavHeader = WavHeader;

}
getAudioData();

VideoSave.propTypes = {
  videoDatas: PropTypes.any,
  drawDatas: PropTypes.any
}
export default VideoSave