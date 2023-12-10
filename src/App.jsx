import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import LinkForm from "./LinkForm/LinkForm";
import { links } from "./constants/links";
import "./App.css";
// import RawLinkForm from "./RawLinkForm/RawLinkForm";

export default function App() {
  const [link, setLink] = useState(localStorage.getItem("link"));
  // const [isRawLink, setIsRawLink] = useState(localStorage.getItem("isRawLink"));

  useEffect(() => {
    if (link) localStorage.setItem("link", link);
  }, [link]);

  // useEffect(() => {
  //   if (isRawLink) localStorage.setItem("isRawLink", isRawLink);
  // }, [isRawLink]);

  return (
    <div className="App">
      <VideoPlayer streamLink={links[link]} />
      <LinkForm
        link={link}
        setLink={setLink}
        // changed={() => setIsRawLink(false)}
      />
      {/* <RawLinkForm
        link={link}
        setLink={setLink}
        changed={() => setIsRawLink(true)}
      /> */}
    </div>
  );
}
