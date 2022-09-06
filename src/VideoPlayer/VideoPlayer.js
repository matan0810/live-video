import React, { useState, useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { usePrevious } from "./usePrevious";
import VideoJSHebrew from "./videoJSHeDictionary.json";

videojs.log.level("off");
videojs.addLanguage("he", VideoJSHebrew);

export default function VideoPlayer({ cameraLink }) {
  const [videoNode, setVideoNode] = useState(null);
  const prevNode = usePrevious(videoNode);
  const player = useRef();

  useEffect(() => {
    if (!videoNode || !cameraLink) return;

    const options = {
      height: 200,
      width: 300,
      autoplay: true,
      controls: true,
      language: "he",
    };

    if (!player.current || prevNode !== videoNode) {
      player.current = videojs(videoNode, options);
    }

    player.current.src([{ src: cameraLink, type: "application/x-mpegURL" }]);
  }, [cameraLink, videoNode, prevNode]);

  if (!cameraLink) return null;

  return (
    <div data-vjs-player>
      <video ref={setVideoNode} className="video-js" />
    </div>
  );
}
