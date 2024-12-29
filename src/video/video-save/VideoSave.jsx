import PropTypes from "prop-types";
import AudioTrackMixer from "audio-track-mixer";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL} from "@ffmpeg/util";
import {closeLoading, loading, secondToTimeFormat} from "../Utils.js";

function VideoSave({videoData, videoTopEl, videoBottomEl}) {

  return(
    <>
      <div style={{height: '10vh'}}>
        <button onClick={() => save(videoData, videoTopEl, videoBottomEl)} className={'videoButtonEle'}>SAVE</button>
      </div>
      {/*<canvas id="canvas"></canvas>*/}
      <canvas id="canvas" style={{display: 'none',}}></canvas>
    </>
  );
}

const save = async (videoData, videoTopEl, videoBottomEl) => {
  if (!videoTopEl || !videoBottomEl) {
    return;
  }
  loading();
  const canvas_width = 1280;
  const canvas_height = 720*2;
  let canvasEl = document.getElementById('canvas');
  canvasEl.width = canvas_width;
  canvasEl.height = canvas_height;
  let context = canvasEl. getContext('2d');
  const st = canvasEl.captureStream(30);

  videoTopEl.currentTime = videoData.videoTop.trimStart;
  videoTopEl.volume = 0;
  videoBottomEl.currentTime = videoData.videoBottom.trimStart;
  videoBottomEl.volumn = 0;

  videoTopEl.addEventListener('play', function () {
    const $this = this; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        context.drawImage(videoTopEl, 0, 0, canvas_width, canvas_height / 2);
        setTimeout(loop, 1000 / 30); // drawing at 30fps
      }
    })();
  }, 0);

  videoTopEl.addEventListener('ended', () => {
    videoBottomEl.pause();
    media.media_recorder.stop();
    closeLoading();
  });

  videoBottomEl.addEventListener('play', function () {
    const $this = this; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        context.drawImage($this, 0, canvas_height / 2, canvas_width, canvas_height / 2);
        setTimeout(loop, 1000 / 30); // drawing at 30fps
      }
    })();
  }, 0);

  videoBottomEl.addEventListener('ended', () => {
    videoTopEl.pause();
    media.media_recorder.stop();
    closeLoading();
  });



  //Audio
  const atm = new AudioTrackMixer();
  atm.addTrack(videoTopEl.captureStream(30).getAudioTracks()[0]);
  atm.addTrack(videoBottomEl.captureStream(30).getAudioTracks()[0]);
  st.addTrack(atm.getMixedTrack());

  const chunks = [];
  //Video
  // Create media recorder from canvas stream
  media.media_recorder = new MediaRecorder(st, { mimeType: "video/webm; codecs=vp9" });
  // Record data in chunks array when data is available
  media.media_recorder.ondataavailable = (evt) => { chunks.push(evt.data); };
  // Provide recorded data when recording stops
  media.media_recorder.onstop = () => {media.on_media_recorder_stop(chunks);}
  // Start recording using a 1s timeslice [ie data is made available every 1s)
  media.media_recorder.start(1000);

  videoTopEl.play();
  videoBottomEl.play();
}


const getVideoElement = async (data) => {
  const v = document.createElement('video');
  if ((data.trimEnd - data.trimStart) === data.duration) {
    v.src = URL.createObjectURL(data.file);
    return v;
  }

  const start = secondToTimeFormat(data.trimStart);
  const end = secondToTimeFormat(data.trimEnd);


  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpeg.on("log", (e) => console.log(e));

  await data.file.arrayBuffer().then(async buff => {
    let x = new Uint8Array(buff);
    await ffmpeg.writeFile("video.mp4", x);
    const cmd = `-i video.mp4 -ss 00:${start} -to 00:${end} -c:v copy -c:a copy output.mp4`;
    console.log(cmd);
    await ffmpeg.exec(cmd.split(' '));
    const data = await ffmpeg.readFile('output.mp4');
    v.src = URL.createObjectURL(new Blob([data]));
  });

  return v;
};

const media = {
  on_media_recorder_stop: function(chunks) {
    media.media_recorder = null;

    // Gather chunks of video data into a blob and create an object URL
    var blob = new Blob(chunks, {type: "video/webm" });
    const recording_url = URL.createObjectURL(blob);

    // Attach the object URL to an <a> element, setting the download file name
    const a = document.createElement('a');
    a.style = "display: none;";
    a.href = recording_url;
    a.download = "video.webm";
    document.body.appendChild(a);

    // Trigger the file download
    a.click();

    setTimeout(() => {
      // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
      URL.revokeObjectURL(recording_url);
      document.body.removeChild(a);
    }, 0);
  },
};

VideoSave.propTypes = {
  videoData: PropTypes.any,
  videoTopEl: PropTypes.any,
  videoBottomEl: PropTypes.any
}
export default VideoSave