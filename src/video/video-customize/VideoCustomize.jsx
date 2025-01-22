import PropTypes from "prop-types";
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import TrimTimeRange from "../trim-time-range/TrimTimeRange.jsx";

const VideoCustomize = forwardRef(function VideosControl({ videoDatas, closeFun }, ref) {
  const [state, setState] = useState(null);
  const vc = { isTrim: false, mute: false, currentFocusId: null };

  Object.assign(vc, state);

  useImperativeHandle(ref, () => {
    return {
      setState(str) {
        vc.currentFocusId = str;
        vc.mute = videoDatas[str].mute;
        setState(Object.assign({}, vc));
      }
    };
  }, []);

  useEffect(() => {
  }, []);

  const ttrRef = useRef(null);
  const videoTrim = (e) => {

    setState(Object.assign(vc, {
      isTrim: true
    }));
  }

  const videoMute = (e) => {
    videoDatas[state.currentFocusId].mute = true;
    videoDatas[state.currentFocusId].ele.muted = true;
    setState(Object.assign(vc, {
      mute: true
    }));
  };

  const videoUnMute = (e) => {
    videoDatas[state.currentFocusId].mute = false;
    videoDatas[state.currentFocusId].ele.muted = false;
    setState(Object.assign(vc, {
      mute: false
    }))
  };

  const close = (e) => {
    setState(Object.assign(vc, {
      currentFocusId: ''
    }));
    closeFun(e, ref);
  };

  return (
    <>
      {state ?.currentFocusId ?
        <div id="videoBtnBar" className={'videoButtonArea'}>
          {state ?.isTrim ?
            <TrimTimeRange videoDatas={videoDatas}
              currentFocusId={state ?.currentFocusId}
              ref={ttrRef}
              closeFun={() => { setState(Object.assign(vc, { isTrim: false })) }} />
            : <button id="trimBtn" className={'videoButtonEle'} onClick={videoTrim}>Trim</button>
        }
          {!state ?.mute ?
            <button id="muteBtn" className={'videoButtonEle'} onClick={videoMute}>Mute</button>
            : <button id="unmuteBtn" className={'videoButtonEle'} onClick={videoUnMute}>Unmute</button>
        }
          <button className={'videoButtonEle'} style={{ background: 'lightcyan' }} onClick={close}>Close</button>
        </div>
        : <div id="videoBtnBar" className={'videoButtonArea'}></div>
      }
    </>
  )
});

VideoCustomize.propTypes = {
  videoDatas: PropTypes.any,
  closeFun: PropTypes.func
}

export default VideoCustomize
