import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import "./App.css";

export default function App() {
  const [link, setLink] = useState(localStorage.getItem("link"));

  useEffect(() => {
    if (link) localStorage.setItem("link", link);
  }, [link]);

  return (
    <div className="App">
      <VideoPlayer cameraLink={link} />
      <Form link={link} setLink={setLink} />
    </div>
  );
}

function Form({ link, setLink }) {
  const [field, setField] = useState(link);

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <label>הכנס קישור:</label>
        <input
          className="input"
          type="text"
          required
          disabled={!!link}
          value={field}
          onChange={({ target }) => setField(target.value)}
        />
        {link ? (
          <button
            className="button"
            style={{ backgroundColor: "orange" }}
            onClick={() => setLink("")}
          >
            בחר מחדש
          </button>
        ) : (
          <button className="button" onClick={() => setLink(field)}>
            בחר
          </button>
        )}
      </form>
    </div>
  );
}
