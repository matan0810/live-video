import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import LinkForm from "./LinkForm/LinkForm";
import "./App.css";

export default function App() {
  const [link, setLink] = useState(localStorage.getItem("link"));

  useEffect(() => {
    if (link) localStorage.setItem("link", link);
  }, [link]);

  return (
    <div className="App">
      <VideoPlayer streamLink={link} />
      <LinkForm link={link} setLink={setLink} />
    </div>
  );
}
