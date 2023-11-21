import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import SelectLink from "./SelectLink/SelectLink";
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

  const onChangeLink = (e) => {
    e.preventDefault();
    setField(e.target.value);
  };

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
          onChange={onChangeLink}
        />
        {!link && (
          <SelectLink field={field} link={link} setLink={onChangeLink} />
        )}
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
