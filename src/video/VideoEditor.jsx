import './VideoEditor.css';
import PropTypes from "prop-types";
import {useEffect, useState} from "react";
import TrimTimeRange from "./trim-time-range/TrimTimeRange.jsx";
import VideoSave from "./video-save/VideoSave.jsx";
import {closeLoading, loading} from "./Utils.js";

const videoData = {};
const eles = {};
let currentFocus = {};
function VideoEditor({files}) {
  const [state, setState] = useState(currentFocus);

  loading();
  if (files?.length === 2) {
    console.log(files);
    videoData.videoTop = {
      id: 'videoTop',
      uri: URL.createObjectURL(files[0]),
      file: files[0],
      trimStart: 0,
      ori: {
        uri: URL.createObjectURL(files[0]),
      }
    }
    videoData.videoBottom = {
      id: 'videoBottom',
      uri: URL.createObjectURL(files[1]),
      file: files[1],
      trimStart: 0,
      ori: {
        uri: URL.createObjectURL(files[1])
      }
    }
  }

  if (state.id) {
    videoData[state.id] = state;
    eles[state.id].currentTime = state.trimStart;
  }

  useEffect(() => {
    const ids = ['videoTop', 'videoTopHide', 'videoBottom', 'videoBottomHide', 'videoBtnBar',
      'playBtn', 'stopBtn', 'trimBtn', 'muteBtn', 'unmuteBtn'];
    ids.forEach((id) => {
      eles[id] = document.getElementById(id);
      if(eles[id].tagName === 'VIDEO') {
        videoData
      }
    });
    const vid = ['videoTop', 'videoBottom'];
    vid.forEach((id) => {
      eles[id].onloadedmetadata = () => {
        videoData[id].duration = eles[id].duration;
        videoData[id].trimEnd = eles[id].duration;
        closeLoading();
      }
    });
  }, [currentFocus]);
  return (
    <>
      <div className={'elements-center'}>
        <div>
          <VideoSave videoData={videoData} videoTopEl={eles.videoTopHide} videoBottomEl={eles.videoBottomHide}></VideoSave>
          <div className={'videoArea'}>
            <video id="videoTop" onClick={selectVideo} className={'videoEle'} src={videoData.videoTop.uri}></video>
            <video id="videoTopHide" src={videoData.videoTop.uri} preload={'auto'} style={{width: '1280px', height: '720px', display: 'none',}}></video>
            <video id="videoTopOriHide" src={videoData.videoTop.ori.uri} style={{display: 'none',}}></video>
            <video id="videoBottom" onClick={selectVideo} className={'videoEle'} src={videoData.videoBottom.uri}></video>
            <video id="videoBottomHide" src={videoData.videoBottom.uri} preload={'auto'} style={{display: 'none',}}></video>
            <video id="videoTBottomOriHide" src={videoData.videoBottom.ori.uri} style={{display: 'none',}}></video>
          </div>
          <div className={'videoButtonArea'}>
            <button id="restartBtn" onClick={videoRestart} className={'videoButtonEle'}>Restart</button>
            <button id="playBtn" onClick={videoPlay} className={'videoButtonEle'}>Play</button>
            <button id="stopBtn" onClick={stopPlay} className={'videoButtonEle'}>Stop</button>
          </div>
          <div id="videoBtnBar" style={{visibility: 'hidden'}} className={'videoButtonArea'}>
            {/*<div className={'timeDiv'}>*/}
              <div>
                <TrimTimeRange currentFocus={currentFocus} parentSetState={setState} />
              </div>
              <button id="trimBtn" className={'videoButtonEle'}>Trim</button>
            {/*</div>*/}
            <button id="muteBtn" className={'videoButtonEle'} onClick={videoMute}>Mute</button>
            <button id="unmuteBtn" className={'videoButtonEle'} onClick={videoUnMute}>Unmute</button>
          </div>
          <div className={'videoBarArea'}>
            <div>
              <div id="videoTopBar"></div>
              <div id="videoBottmBar"></div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

VideoEditor.propTypes = {
  files: PropTypes.any
}

const videoRestart = (e) => {
  eles.videoTop.currentTime = videoData.videoTop.trimStart;
  eles.videoBottom.currentTime = videoData.videoBottom.trimStart;
};

const videoPlay = (e) => {
  eles.videoTop.play();
  eles.videoBottom.play();
}
const stopPlay = (e) => {
  eles.videoTop.pause();
  eles.videoBottom.pause();
}
const videoMute = (e) => {
  videoData[currentFocus.id].mute = true;
  eles[currentFocus.id].muted = true;
  eles.muteBtn.style.display = 'none';
  eles.unmuteBtn.style.display = 'inline';
};
const videoUnMute = (e) => {
  videoData[currentFocus.id].mute = false;
  eles[currentFocus.id].muted = false;
  eles.muteBtn.style.display = 'inline';
  eles.unmuteBtn.style.display = 'none';
};
const selectVideo = (e) => {
  Array.prototype.slice.call(document.getElementsByClassName('videoEleSelected')).forEach((e) => {
    e.className = e.className.replace(' videoEleSelected', '');
  });
  e.target.className += ' videoEleSelected';

  const id = e.target.id;
  Object.assign(currentFocus, videoData[id]);

  if (eles.videoBtnBar.style.visibility === 'visible') {
    if (eles.trimBtn.style.display === 'none') {
      eles.trimBtn.click();
    }
  }

  if (videoData[id].mute) {
    eles.muteBtn.style.display = 'none';
    eles.unmuteBtn.style.display = 'inline';
  } else {
    eles.muteBtn.style.display = 'inline';
    eles.unmuteBtn.style.display = 'none';
  }

  eles.videoBtnBar.style.visibility = 'visible';
}

export default VideoEditor
