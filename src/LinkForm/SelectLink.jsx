import React from "react";
import { Select, MenuItem } from "@mui/material";
import { links } from "../constants/links";

function SelectLink({ setLink, field, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: "10px",
        marginBottom: "10px",
      }}
    >
      <Select
        label="לינק"
        value={field}
        onChange={setLink}
        variant="outlined"
        sx={{ backgroundColor: disabled ? "grey" : "white" }}
        disabled={disabled}
      >
        <MenuItem value="">
          <em>בחר לינק</em>
        </MenuItem>
        {Object.keys(links).map((key) => (
          <MenuItem key={key} value={key}>
            {key}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

export default SelectLink;
