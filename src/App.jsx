import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import LinkForm from "./LinkForm/LinkForm";
import { links } from "./constants/links";
import "./App.css";

export default function App() {
  const [link, setLink] = useState(localStorage.getItem("link"));
  const [isRaw, setIsRaw] = useState(localStorage.getItem("isRaw") === "true");

  useEffect(() => {
    if (link) localStorage.setItem("link", link);
  }, [link]);

  useEffect(() => {
    localStorage.setItem("isRaw", isRaw);
    setLink("");
  }, [isRaw]);

  return (
    <div className="App">
      <VideoPlayer streamLink={isRaw ? link : links[link]} />
      <LinkForm
        link={link}
        setLink={setLink}
        isRaw={isRaw}
        setIsRaw={setIsRaw}
      />
    </div>
  );
}
