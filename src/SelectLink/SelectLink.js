import React from "react";
import { Select, MenuItem } from "@mui/material";
import { links } from "./links";

function SelectLink({ link, setLink, field }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: "10px",
        marginBottom: "10px",
      }}
    >
      <Select label="לינק" value={field} onChange={setLink} variant="outlined">
        <MenuItem value="">
          <em>בחר לינק</em>
        </MenuItem>
        {Object.keys(links).map((key) => (
          <MenuItem key={key} value={links[key]}>
            {key}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

export default SelectLink;
