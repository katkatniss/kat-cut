import './VideosControl.css';
import PropTypes from "prop-types";
import VideoSave from "../video-save/VideoSave";
import { secondToTimeFormat } from "../Utils.js";
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';


let videoTop = null;
let videoBottom = null;
const VideosControl = forwardRef(function VideosControl({ videoDatas }, ref) {
  const [state, setState] = useState(null);

  useImperativeHandle(ref, () => {
    return {
      setState(str) {
        setState(str);
      }
    };
  }, []);

  let videoDuration = 0;
  let curr = 0;

  const top = videoDatas.videoTop;
  const bottom = videoDatas.videoBottom;

  if (top && bottom) {
    videoTop = videoTop || top.ele;
    videoBottom = videoBottom || bottom.ele;

    const top_d = top.trimedDuration || top.duration || 0;
    const bottom_d = bottom.trimedDuration || bottom.duration || 0;

    if (top_d < bottom_d) {
      videoDuration = top_d;
      if (videoBottom) {
        let t_top = null;
        videoTop.addEventListener('play', (e) => {
          if (e.target.currentTime >= top.trimEnd) {
            videoStop();
            return;
          }
          t_top = setInterval(() => {
            refreshControlTimer(e.target.currentTime - top.trimStart);
            const key = secondToTimeFormat(e.target.currentTime);
            const dc = drawDatas[key];
            if (dc) {
              dc.style.display = 'block';
            }
          }, 100);
        });
        videoTop.addEventListener('pause', () => clearInterval(t_top));
      }
    } else {
      videoDuration = bottom_d;
      if (videoBottom) {
        let t_bottom = null;
        videoBottom.addEventListener('play', (e) => {
          // t_bottom = setInterval(() => console.log('bottom ', e.target.currentTime), 10);
          t_bottom = setInterval(() => refreshControlTimer(e.target.currentTime - top.trimBottom), 100);
        });
        videoBottom.addEventListener('pause', () => clearInterval(t_bottom));
      }
    }

  }

  useEffect(() => {

  }, []);

  const videoRestart = (e) => {
    videoTop.currentTime = videoDatas.videoTop.trimStart;
    videoBottom.currentTime = videoDatas.videoBottom.trimStart;
    refreshControlTimer(0);
  };

  const videoPlay = (e) => {
    videoTop.play();
    videoBottom.play();
  }

  const videoStop = (e) => {
    videoTop.pause();
    videoBottom.pause();
  }

  let dc = null; // canvas 
  let dcc = null; // context of canvas
  let drawDatas = {};

  const videoDraw = (e) => {
    const key = secondToTimeFormat(curr);

    dc = drawDatas[key];

    if (!dc) {
      dc = document.createElement("canvas");
      const top = videoTop.getBoundingClientRect();
      Object.assign(dc.style, {
        position: 'absolute',
        top: top.top + 'px',
        left: top.left + 'px',
        width: top.width + 'px',
        height: top.height * 2 + 'px'
      });
      dc.addEventListener('mousedown', videoDrawStart);
      dc.addEventListener('mousemove', videoDrawing);
      dc.addEventListener('mouseup', videoDrawEnd);
      document.body.append(dc);
      for (let i = 0.01; i <= 1; i = i + 0.01) {
        drawDatas[secondToTimeFormat(curr + i)] = dc;
      }
    }

    drawDatas[key] = dc;

    e.target.nextSibling.style.display = 'inline';
    e.target.style.display = 'none';
  }

  const videoStopDraw = (e) => {

    dc.style.pointerEvents = 'none';

    e.target.previousSibling.style.display = 'inline';
    e.target.style.display = 'none';
  }

  // Draw Events
  const videoDrawStart = (e) => {
    dcc = dc.getContext('2d');
    dcc.beginPath();
    const rect = dc.getBoundingClientRect();
    const wfactor = dc.width / rect.width;
    const hfactor = dc.height / rect.height;
    dcc.moveTo((e.offsetX) * wfactor, (e.offsetY) * hfactor);
  }
  const videoDrawing = (e) => {
    if (dcc) {
      const rect = dc.getBoundingClientRect();
      const wfactor = dc.width / rect.width;
      const hfactor = dc.height / rect.height;
      dcc.lineTo((e.offsetX) * wfactor, (e.offsetY) * hfactor);
      dcc.stroke();
    }
  }
  const videoDrawEnd = (e) => {
    dcc = null;
  }

  let controlStart = false;
  const mouseStart = {};

  const videosControlStart = (e) => {
    controlStart = true;

    if (!mouseStart.x) {
      mouseStart.x = e.clientX;
    }
    logPosition.push(mouseStart.x);
  };

  let logPosition = [];
  const videosControlling = (e) => {
    if (controlStart) {
      logPosition.push(e.clientX);
      const control = e.target;
      const newP = e.clientX - mouseStart.x;
      if (newP >= 0 && newP <= control.parentElement.clientWidth) {
        const controlTime = newP / control.parentElement.clientWidth * videoDuration;
        refreshControlTimer(controlTime);
        videoTop.currentTime = controlTime;
        videoBottom.currentTime = controlTime;
        console.log(logPosition);
      }
    }
  };

  const videosControlEnd = (e) => {
    controlStart = false;
  };


  const controlRef = useRef(null);
  const refreshControlTimer = (t) => {
    curr = t;

    const control = controlRef.current;
    const span = control.firstChild

    control.style.left = (curr / videoDuration || 0) * control.parentElement.clientWidth + 'px';
    span.textContent = secondToTimeFormat(curr);

    const canvases = document.getElementsByTagName('canvas');
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].style.display = 'none';
    }
    const c = drawDatas[secondToTimeFormat(curr)];
    if (c) {
      c.style.display = 'block';
    }
  }

  return (
    <>
      {/* <VideoSave videoDatas={videoDatas} drawDatas={drawDatas}/> */}
      <div className={'videoButtonArea'}>
        <button id="restartBtn" onClick={videoRestart} className={'videoButtonEle unselectable'}>Restart</button>
        <button id="playBtn" onClick={videoPlay} className={'videoButtonEle unselectable'}>Play</button>
        <button id="stopBtn" onClick={videoStop} className={'videoButtonEle unselectable'}>Stop</button>
        <button id="drawBtn" onClick={videoDraw} className={'videoButtonEle unselectable'}>Draw</button>
        <button id="stopDrawBtn" style={{ display: 'none' }} onClick={videoStopDraw} className={'videoButtonEle unselectable'}>StopDraw</button>
      </div>
      <div className={'videoBarArea'}>
        <div onMouseUp={videosControlEnd}>
          <div id="videoControl" ref={controlRef} onMouseDown={videosControlStart} onMouseMove={videosControlling}>
            <span className={'unselectable'} onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>{secondToTimeFormat(curr)}</span>
          </div>
          <div onMouseMove={(e) => e.stopPropagation()} id="videoControlLine">
            <div className={'unselectable'} style={{ textAlign: 'left' }}>{secondToTimeFormat(0)}</div>
            <div className={'unselectable'} style={{ textAlign: 'right' }}>{secondToTimeFormat(videoDuration)}</div>
          </div>
        </div>
      </div>
    </>
  )
});

VideosControl.propTypes = {
  videoDatas: PropTypes.any
}

export default VideosControl
