import './VideoEditor.css';
import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";
import { closeLoading, loading } from "./Utils.js";
import VideosControl from './videos-control/VideosControl';
import VideoCustomize from './video-customize/VideoCustomize';

const videoDatas = {};
const eles = {};
let currentFocus = {};
function VideoEditor({ files }) {
  const [state, setState] = useState(currentFocus);

  loading();
  if (files ?.length === 2) {
    console.log(files);
    videoDatas.videoTop = {
      id: 'videoTop',
      uri: URL.createObjectURL(files[0]),
      file: files[0],
      trimStart: 0,
      ori: {
        uri: URL.createObjectURL(files[0]),
      }
    }
    videoDatas.videoBottom = {
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
    videoDatas[state.id] = state;
    eles[state.id].currentTime = state.trimStart;
  }

  useEffect(() => {
    const vid = ['videoTop', 'videoBottom'];
    let flag = false;
    vid.forEach((id) => {
      eles[id] = document.getElementById(id);
      eles[id].onloadedmetadata = () => {
        videoDatas[id].duration = eles[id].duration;
        videoDatas[id].trimEnd = eles[id].duration;
        videoDatas[id].ele = eles[id];
        if (flag) {
          let w = eles[id].getBoundingClientRect().width;
          eles[id].parentElement.parentElement.style.width = w + 'px';
          closeLoading();
          vcRef.current.setState(0);
        }
        flag = true;
      }

      let t = null;
      eles[id].addEventListener('play', (e) => {
        const id = e.target.id;
        if (e.target.currentTime >= videoDatas[id].trimEnd) {
          vcRef.current.videoStop(e);
          return;
        }
        t = setInterval(() => {
          vcRef.current.refreshControlTimer(e.target.currentTime - videoDatas[id].trimStart)
        }, 100);
      });
      eles[id].addEventListener('pause', (e) => {
        vcRef.current.setState(e.target.currentTime - videoDatas[e.target.id].trimStart)
        clearInterval(t);
      });
    });

  }, []);

  const vcRef = useRef(null);
  const vcmRef = useRef(null);

  return (
    <>
      <div className={'elements-center'}>
        <div>
          <div className={'videoArea'}>
            <video id="videoTop" preload={'auto'} onClick={(e) => { selectVideo(e, vcmRef) }} className={'videoEle'}>
              <source src={videoDatas.videoTop.uri + '#t=0.1'} type={'video/mp4'} />
            </video>
            <video id="videoBottom" preload={'auto'} onClick={(e) => { selectVideo(e, vcmRef) }} className={'videoEle'}>
              <source src={videoDatas.videoBottom.uri + '#t=0.1'} type={'video/mp4'} />
            </video>
          </div>
          <VideoCustomize videoDatas={videoDatas} ref={vcmRef} closeFun={selectVideo} vcRef={vcRef}/>
          <VideosControl videoDatas={videoDatas} ref={vcRef} />
        </div>
      </div>
    </>
  )
}

VideoEditor.propTypes = {
  files: PropTypes.any
}

const selectVideo = (e, vcmRef) => {
  e.stopPropagation();
  Array.prototype.slice.call(document.getElementsByClassName('videoEleSelected')).forEach((e) => {
    e.className = e.className.replace(' videoEleSelected', '');
  });

  const id = e.target.id;
  const isNotSelectVideo = !videoDatas[id];

  e.target.className += isNotSelectVideo ? '' : ' videoEleSelected';

  currentFocus = videoDatas[id] || {};

  vcmRef.current.setState(currentFocus.id);
}

export default VideoEditor
