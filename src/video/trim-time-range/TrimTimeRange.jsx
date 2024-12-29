import "./TrimTimeRange.css";
import PropTypes from "prop-types";
import {useEffect, useRef, useState} from "react";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {toBlobURL} from "@ffmpeg/util";
import {secondToTimeFormat} from "../Utils.js";


function TrimTimeRange({currentFocus, parentSetState}) {

  const ref = useRef(null);

  const refreshParent = () => {
    parentSetState(Object.assign({}, currentFocus));
  }

  const showNext = (e) => {
    e.target.nextElementSibling.style.display = 'inline';
    e.target.style.display = 'none';
  };

  const trimVideo = async (e) => {
    const timeInputs = ref.current.getElementsByClassName('timeInputs');
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

  const close = () => {
    ref.current.style.display = 'none';
    document.getElementById("trimBtn").style.display = 'inline';
  };

  const inputValueChange = () => {
    const timeInputs = ref.current.getElementsByClassName('timeInputs');
    const startInputs = timeInputs[0].getElementsByTagName('input');
    const endInputs = timeInputs[1].getElementsByTagName('input');

    let start = 0;
    start += startInputs[0].value * 60;
    start += startInputs[1].value * 1;
    start += startInputs[2].value / 1000;

    currentFocus.trimStart = start;
    refreshParent();
  };

  const [state, setState] = useState(currentFocus.id);
  useEffect(() => {
    const trimBtn = document.getElementById("trimBtn");
    trimBtn.onclick = e => {
      if (state != currentFocus.id) {
        setState(currentFocus.id);
        trimBtn.style.display = 'none';
      }
    }
  }, [currentFocus.id]);

  if(!currentFocus?.trimEnd) {
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
  return (
    <div ref={ref}>
      <span className={'timeSpan'} onClick={showNext}>{startText}</span>
      <div className={'timeInputs'} style={{display: 'none'}}>
        <input defaultValue={startArr[0]} /> :
        <input defaultValue={startArr[1]} /> .
        <input defaultValue={startArr[2]} />
      </div>
      ~
      <span className={'timeSpan'} onClick={showNext}>{endText}</span>
      <div className={'timeInputs'}  style={{display: 'none'}}>
        <input defaultValue={endArr[0]} /> :
        <input defaultValue={endArr[1]} /> .
        <input defaultValue={endArr[2]} />
      </div>
      <button className={'timeBtn'} onClick={inputValueChange}>TEST</button>
      <button className={'timeBtn'} onClick={close}>Close</button>
    </div>
  );
};

TrimTimeRange.propTypes = {
  currentFocus: PropTypes.any,
  parentSetState: PropTypes.func
}

export default TrimTimeRange