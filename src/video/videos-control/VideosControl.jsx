import './VideosControl.css';
import PropTypes from "prop-types";
import VideoSave from "../video-save/VideoSave";
import {isMobileDevice, secondToTimeFormat} from "../Utils.js";
import {useState, useEffect, forwardRef, useImperativeHandle, useRef} from 'react';


let videoTop = null;
let videoBottom = null;
let drawDatas = {};
let videoDuration = 0;

const vc = {
  curr: 0,
  isPlay: false,
  isDraw: false,
  dc: null
};

const VideosControl = forwardRef(function VideosControl({videoDatas}, ref) {

  const [state, setState] = useState(vc);

  const videoRestart = (e) => {
    videoTop.currentTime = videoDatas.videoTop.trimStart;
    videoBottom.currentTime = videoDatas.videoBottom.trimStart;
    refreshControlTimer(0);
  };

  const videoPlay = (e) => {
    videoTop.play();
    videoBottom.play();
    reRender(state, {isPlay: true, curr: vc.curr});
  }

  const videoStop = (e) => {
    videoTop.pause();
    videoBottom.pause();
    reRender(state, {isPlay: false, curr: vc.curr});
  }

  const refreshControlTimer = (t) => {
    if (t >= videoDuration) {
      videoStop();
      return;
    }
    vc.curr = t;

    const control = controlRef.current;
    const left = (t / videoDuration || 0);
    control.style.left = (left > 1 ? 1 : left) * controlRef.current?.parentElement.clientWidth + 'px';
    control.firstChild.style.left = ((left > 1 ? 1 : left) * -50) + 'px';

    const span = control.firstChild
    span.textContent = secondToTimeFormat(t);

    const c = drawDatas[secondToTimeFormat(t)];
    const canvases = document.getElementsByTagName('canvas');
    for (let i = 0; i < canvases.length; i++) {
      if (c && canvases[i] === c) {
        canvases[i].style.display = 'block';
      } else {
        canvases[i].style.display = 'none';
      }
    }

  }

  const reRender = (state, data) => {
    Object.keys(data).forEach((key) => {
      state[key] = data[key];
    });
    setState(Object.assign({}, state));
  }

  useImperativeHandle(ref, () => {
    return {
      setState(curr) {
        reRender(state, {curr: curr});
      },
      refreshControlTimer(curr) {
        refreshControlTimer(curr);
      },
    };
  }, []);

  const controlRef = useRef(null);

  useEffect(() => {
  }, []);

  const top = videoDatas.videoTop;
  const bottom = videoDatas.videoBottom;

  if (top.ele && bottom.ele) {
    videoTop = videoTop || top.ele;
    videoBottom = videoBottom || bottom.ele;

    const top_d = top.trimedDuration || top.duration || 0;
    const bottom_d = bottom.trimedDuration || bottom.duration || 0;

    if (top_d < bottom_d) {
      videoDuration = top_d;
    } else {
      videoDuration = bottom_d;
    }

  } else {
    return (<div className={'videoBarArea'}>
      <div ref={controlRef}></div>
    </div>);
  }

  const videoDraw = (e) => {
    const key = secondToTimeFormat(state.curr);

    let dc = drawDatas[key];

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
      dc.addEventListener(isMobileDevice() ? 'touchstart' : 'mousedown', videoDrawStart);
      dc.addEventListener(isMobileDevice() ? 'touchmove' : 'mousemove', videoDrawing);
      dc.addEventListener(isMobileDevice() ? 'touchend' : 'mouseup', videoDrawEnd);
      document.body.append(dc);
      for (let i = 0.1; i <= 1; i = i + 0.1) {
        drawDatas[secondToTimeFormat(state.curr + i)] = dc;
      }
    }
    dc.style.pointerEvents = 'auto';
    drawDatas[key] = dc;

    reRender(state, {isDraw: true, dc: dc});
  }

  const videoStopDraw = (e) => {
    state.dc.style.pointerEvents = 'none';

    reRender(state, {isDraw: false, dc: null});
  }

  let dcc = null; // context of canvas
  // Draw Events
  const videoDrawStart = (e) => {
    const dc = e.target;
    dcc = dc.getContext('2d');
    dcc.strokeStyle = "red";
    dcc.beginPath();
    const rect = dc.getBoundingClientRect();
    const wfactor = dc.width / rect.width;
    const hfactor = dc.height / rect.height;
    dcc.moveTo((e.offsetX) * wfactor, (e.offsetY) * hfactor);
  }
  const videoDrawing = (e) => {
    const dc = e.target;
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

  return (
    <>
      {/* <VideoSave videoDatas={videoDatas} drawDatas={drawDatas}/> */}
      <div className={'videoButtonArea'}>
        <button id="restartBtn" onClick={videoRestart} className={'videoButtonEle unselectable'}>Restart</button>
        <button id="playBtn" onClick={videoPlay} className={'videoButtonEle unselectable'}>Play</button>
        <button id="stopBtn" onClick={videoStop} className={'videoButtonEle unselectable'}>Stop</button>
        {
          state.isPlay ? <div></div> :
            (state.isDraw ?
              <button onClick={videoStopDraw} className={'videoButtonEle unselectable'}>StopDraw</button>
              : <button onClick={videoDraw} className={'videoButtonEle unselectable'}>Draw</button>)
        }
      </div>
      <div className={'videoBarArea'}>
        <div onMouseUp={videosControlEnd}>
          <div id="videoControl"
               ref={controlRef}
               style={{left: (state.curr / videoDuration || 0) * controlRef.current?.parentElement.clientWidth}}
               onMouseDown={videosControlStart}
               onMouseMove={videosControlling}>
            <span className={'unselectable'} onMouseDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => e.stopPropagation()}>
              {secondToTimeFormat(state.curr)}
            </span>
          </div>
          <div onMouseMove={(e) => e.stopPropagation()} id="videoControlLine">
            <div className={'unselectable'} style={{textAlign: 'left'}}>{secondToTimeFormat(0)}</div>
            <div className={'unselectable'} style={{textAlign: 'right'}}>{secondToTimeFormat(videoDuration)}</div>
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
