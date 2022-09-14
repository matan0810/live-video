import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import "./App.css";

// https://es1.quest123.top:8088/live/socolivepro10010/playlist.m3u8?vidictid=192491573324&id=116133&pk=7b31a258377513b27d9e69323074e8702ca4fd2310572030149f4b7ba0faa635d4add3793553a011c1594b260ca8644a0d2040b424f2b622e7d2f0112c72ee07

export default function App() {
  const [link, setLink] = useState(localStorage.getItem("link"));
  const [field, setField] = useState();

  useEffect(() => {
    localStorage.setItem("link", field);
  }, [field]);

  return (
    <div className="App">
      <div className="body">
        <div className="form">
          <form onSubmit={(e) => e.preventDefault()}>
            <label>הכנס קישור:</label>
            <input
              className="input"
              type="text"
              required
              value={field}
              onChange={({ target }) => setField(target.value)}
            />
            <button className="button" onClick={() => setLink(field)}>
              בחר
            </button>
          </form>
        </div>

        <VideoPlayer cameraLink={link} />
      </div>
    </div>
  );
}
