import { ActionIcon } from "@mantine/core";
import { IconFocusCentered } from "@tabler/icons-react";
import { useMap } from "@vis.gl/react-google-maps";

import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../../constants.ts";
import classes from "./MapResetControl.module.css";

export function MapResetControl() {
  const map = useMap();

  return (
    <ActionIcon
      aria-label="Reset map"
      variant="white"
      color="gray.7"
      size={33}
      radius={3}
      m={10}
      className={classes.control}
      disabled={!map}
      onClick={() =>
        map?.moveCamera({
          center: MAP_DEFAULT_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
          heading: 0,
          tilt: 0,
        })
      }
    >
      <IconFocusCentered size={25} stroke={1.5} />
    </ActionIcon>
  );
}
