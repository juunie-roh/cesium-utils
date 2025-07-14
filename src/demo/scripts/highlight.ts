import * as Cesium from "cesium";

import { Highlight } from "@/highlight";

const { viewer } = window;
const highlight = Highlight.getInstance(viewer);

viewer.dataSources.add(
  Cesium.GeoJsonDataSource.load("/data/ne_10m_us_states.topojson"),
);
// Set camera
viewer.camera.lookAt(
  Cesium.Cartesian3.fromDegrees(-98.0, 40.0),
  new Cesium.Cartesian3(0.0, -4790000.0, 3930000.0),
);
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

function onMouseMove(movement: Cesium.ScreenSpaceEventHandler.MotionEvent) {
  const picked = viewer.scene.pick(movement.endPosition);
  highlight.show(picked);
}

viewer.screenSpaceEventHandler.setInputAction(
  onMouseMove,
  Cesium.ScreenSpaceEventType.MOUSE_MOVE,
);
