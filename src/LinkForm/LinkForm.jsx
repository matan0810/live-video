import { useState } from "react";
import CustomSwitch from "./CustomSwitch";
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
      <form onSubmit={(e) => e.preventDefault()} style={{ width: "100%" }}>
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
            בחר שידור
          </button>
        )}

        <CustomSwitch
          checked={isRaw}
          onChange={({ target }) => setIsRaw(target.checked)}
        />
      </form>
    </div>
  );
}

export default LinkForm;
