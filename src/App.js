import "./App.css";
import VideoPlayer from "./VideoPlayer/VideoPlayer";

const link =
  "http://185.53.88.143:8080/hls/streama192899/index.m3u8?cst=83b3a7af5d5c840834a9319b7da36bb3";

export default function App() {
  return (
    <div
      className="App
    "
    >
      <div className="App-header">
        <span>הכנס קישור</span>

        <VideoPlayer cameraLink={link} />
      </div>
    </div>
  );
}
