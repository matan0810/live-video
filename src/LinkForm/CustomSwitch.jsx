import { styled } from "@mui/material/styles";
import { Switch } from "@mui/material";

const MaterialUISwitch = styled(Switch)(({ theme, checked }) => ({
  width: 62,
  height: 34,
  padding: 7,
  direction: "ltr",
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: checked ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: checked ? "#003892" : "#001e3c",
    width: 32,
    height: 32,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="12" viewBox="0 0 44 24"><path fill="white" fill-rule="evenodd" d="M40 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM4 0a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h36a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4Zm4 11.5c0-.828.38-1.5.848-1.5h11.304c.468 0 .848.672.848 1.5s-.38 1.5-.848 1.5H8.848C8.38 13 8 12.328 8 11.5Zm23.707-1.207L31 9.586L29.586 11l.707.707l2 2l.707.707l.707-.707l2-2l.707-.707L35 9.586l-.707.707L33 11.586l-1.293-1.293Z" clip-rule="evenodd"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: checked ? "#8796A5" : "#aab4be",
    borderRadius: 10,
  },
}));

export default MaterialUISwitch;
