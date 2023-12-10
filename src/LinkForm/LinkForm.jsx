import { useState } from "react";
import SelectLink from "./SelectLink";
import "./LinkForm.css";

function LinkForm({ link, setLink }) {
  const [field, setField] = useState(link);

  const onChangeLink = (e) => {
    e.preventDefault();
    setField(e.target.value);
  };

  return (
    <div className="form">
      <form onSubmit={(e) => e.preventDefault()}>
        <SelectLink field={field} link={link} setLink={onChangeLink} disabled={!!link} />

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

export default LinkForm;
