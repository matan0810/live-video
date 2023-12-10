import { useState } from "react";
import { Switch } from "@mui/material";
import SelectLink from "./SelectLink";
import "./LinkForm.css";

function LinkForm({ link, setLink, isRaw, setIsRaw }) {
  const [field, setField] = useState(link);

  const onChangeLink = (e) => {
    e.preventDefault();
    setField(e.target.value);
  };

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        {isRaw ? (
          <>
            <label>הכנס קישור:</label>
            <input
              className="input"
              type="text"
              required
              disabled={!!link}
              value={field}
              onChange={onChangeLink}
            />
          </>
        ) : (
          <SelectLink
            field={field}
            link={link}
            setLink={onChangeLink}
            disabled={!!link}
          />
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

        <Switch
          checked={isRaw}
          onChange={({ target }) => setIsRaw(target.checked)}
        />
      </form>
    </div>
  );
}

export default LinkForm;
