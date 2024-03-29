import { useState, useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { usePrevious } from "./usePrevious";
import VideoJSHebrew from "./videoJSHeDictionary.json";

const IS_MOBILE = window.innerWidth < 700;
const WIDTH = IS_MOBILE ? 300 : 600;
const HEIGHT = IS_MOBILE ? 200 : 400;

videojs.log.level("off");
videojs.addLanguage("he", VideoJSHebrew);

export default function VideoPlayer({ streamLink }) {
  const [videoNode, setVideoNode] = useState(null);
  const prevNode = usePrevious(videoNode);
  const player = useRef();

  useEffect(() => {
    if (!videoNode || !streamLink) return;

    if (!player.current || prevNode !== videoNode) {
      player.current = videojs(videoNode, {
        width: WIDTH,
        height: HEIGHT,
        autoplay: true,
        controls: true,
        language: "he",
      });
    }

    player.current.src([{ src: streamLink, type: "application/x-mpegURL" }]);
  }, [streamLink, videoNode, prevNode]);

  if (!streamLink) return null;
  return (
    <div
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
      }}
      data-vjs-player
    >
      {streamLink?.isIFrame ? (
        <iframe height={HEIGHT} width={WIDTH} src={streamLink.link} />
      ) : (
        <video ref={setVideoNode} className="video-js" />
      )}
    </div>
  );
}
