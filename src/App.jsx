import './App.css'
import {useEffect, useState} from "react";
import VideoEditor from "./video/VideoEditor.jsx";

function App() {

  let input = null;
  let prop = null;
  const [state, setState] = useState(prop);
  useEffect(() => {
    input = document.getElementById("fileInput");
    input.onchange = e => {
      prop = prop || {};
      prop.files = e.target.files;
      setState(prop);
    }
  }, [prop]);

  return (
    <div>
      { state ? <VideoEditor files={state.files}/> :
        <div className={'elements-center'}>
          <button className={'file-btn'} onClick={() => input.click()}>Choose TWO Files</button>
          <input style={{display: 'none'}} id={'fileInput'} type="file" name="filefield" multiple/>
        </div> }
    </div>
    // <iframe src={'/video?muted=1'} allow={"autoplay"}></iframe>
  )
}

export default App
