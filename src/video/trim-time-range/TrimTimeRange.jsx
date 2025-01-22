import "./TrimTimeRange.css";
import PropTypes from "prop-types";
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { secondToTimeFormat } from "../Utils.js";

const TrimTimeRange = forwardRef(function TrimTimeRange({ videoDatas, currentFocusId, closeFun }, ref) {
  const [state, setShowHideState] = useState(null);
  const currentFocus = videoDatas[state ?.currentFocusId || currentFocusId];

  useImperativeHandle(ref, () => {
    return {
      setState(str) {
        setShowHideState(Object.assign({}, {
          currentFocusId: str,
          ts: true,
          bs: true
        }));
      }
    };
  }, []);


  const eleDispaly = state ? state : {
    ts: true,
    bs: true
  };

  const divRef = useRef(null);

  const showNext = (hide) => {
    eleDispaly[hide] = false;
    setShowHideState(Object.assign({}, eleDispaly));
  };

  const close = (e) => {
    setShowHideState(Object.assign({}, {
      currentFocusId: ''
    }));
    closeFun(e);
    // document.getElementById("trimBtn").style.display = 'inline';
  };

  const inputValueChange = () => {
    const inputOrSpan = divRef.current.children;

    const startInputs = inputOrSpan[0].getElementsByTagName('input');
    let start = 0;
    if (startInputs.length > 0) {
      start += startInputs[0].value * 60;
      start += startInputs[1].value * 1;
      start += startInputs[2].value / 1000;
      currentFocus.trimStart = start;
    } else {
      start = currentFocus.trimStart;
    }


    const endInputs = inputOrSpan[1].getElementsByTagName('input');
    let end = 0;
    if (endInputs.length > 0) {
      end += endInputs[0].value * 60;
      end += endInputs[1].value * 1;
      end += endInputs[2].value / 1000;
      currentFocus.trimEnd = end;
    } else {
      end = currentFocus.trimEnd;
    }

    currentFocus.trimedDuration = (end - start);

    currentFocus.ele.currentTime = start;
  };

  useEffect(() => {
  }, []);

  if (!currentFocus ?.trimEnd) {
    return (<></>);
  }

  const startText = secondToTimeFormat(currentFocus.trimStart || 0);
  const startArr = startText.split(':');
  startArr[2] = startArr[1].split('.')[1];
  startArr[1] = startArr[1].split('.')[0];
  const endText = secondToTimeFormat(currentFocus.trimEnd);
  const endArr = endText.split(':');
  endArr[2] = endArr[1].split('.')[1];
  endArr[1] = endArr[1].split('.')[0];

  const ds = (flag) => (flag ? 'inline' : 'none');
  return (
    <div ref={divRef}>
      {eleDispaly.ts ? <span className={'timeSpan'} onClick={(e) => { showNext('ts') }}>{startText}</span>
        : <div className={'timeInputs'}>
          <input defaultValue={startArr[0]} /> :
        <input defaultValue={startArr[1]} /> .
        <input defaultValue={startArr[2]} />
        </div>}
      ~
      {eleDispaly.bs ? <span className={'timeSpan'} onClick={(e) => { showNext('bs') }}>{endText}</span>
        : <div className={'timeInputs'}>
          <input defaultValue={endArr[0]} /> :
        <input defaultValue={endArr[1]} /> .
        <input defaultValue={endArr[2]} />
        </div>}
      <button className={'timeBtn'} onClick={inputValueChange}>Trim</button>
      <button className={'timeBtn'} onClick={close}>X</button>
    </div>
  );
});

TrimTimeRange.propTypes = {
  videoDatas: PropTypes.any,
  currentFocusId: PropTypes.string
}

export default TrimTimeRange

const trimVideo = async (e) => {
  const timeInputs = divRef.current.getElementsByClassName('timeInputs');
  let t = 0;
  const start = Array.prototype.slice.call(timeInputs[0].getElementsByTagName('input')).map((i) => i.value).join(':').replace(/:/g, match => ++t === 2 ? '.' : match);
  t = 0;
  const end = Array.prototype.slice.call(timeInputs[1].getElementsByTagName('input')).map((i) => i.value).join(':').replace(/:/g, match => ++t === 2 ? '.' : match);

  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpeg.on("log", (e) => console.log(e));

  currentFocus.file.arrayBuffer().then(async buff => {
    let x = new Uint8Array(buff);
    await ffmpeg.writeFile("video.mp4", x);
    const cmd = `-i video.mp4 -ss 00:${start} -to 00:${end} -c:v copy -c:a copy output.mp4`;
    console.log(cmd);
    await ffmpeg.exec(cmd.split(' '));
    const data = await ffmpeg.readFile('output.mp4');
    currentFocus.uri = URL.createObjectURL(new Blob([data]));

    refreshParent();
  });
};