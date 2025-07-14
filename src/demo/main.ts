import * as Cesium from "cesium";

declare global {
  export interface Window {
    CESIUM_BASE_URL: string;
    viewer: Cesium.Viewer;
  }
}

window.CESIUM_BASE_URL = window.CESIUM_BASE_URL
  ? window.CESIUM_BASE_URL
  : "../../node_modules/cesium/Build/Cesium";

async function main() {
  /*
     Options parsed from query string:
       source=url          The URL of a CZML/GeoJSON/KML data source to load at startup.
                           Automatic data type detection uses file extension.
       sourceType=czml/geojson/kml
                           Override data type detection for source.
       flyTo=false         Don't automatically fly to the loaded source.
       tmsImageryUrl=url   Automatically use a TMS imagery provider.
       lookAt=id           The ID of the entity to track at startup.
       stats=true          Enable the FPS performance display.
       inspector=true      Enable the inspector widget.
       debug=true          Full WebGL error reporting at substantial performance cost.
       theme=lighter       Use the dark-text-on-light-background theme.
       scene3DOnly=true    Enable 3D only mode.
       view=longitude,latitude,[height,heading,pitch,roll]
                           Automatically set a camera view. Values in degrees and meters.
                           [height,heading,pitch,roll] default is looking straight down, [300,0,-90,0]
       saveCamera=false    Don't automatically update the camera view in the URL when it changes.
     */
  const endUserOptions = Cesium.queryToObject(
    window.location.search.substring(1),
  );

  let baseLayer;
  if (Cesium.defined(endUserOptions.tmsImageryUrl)) {
    baseLayer = Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(
        endUserOptions.tmsImageryUrl,
      ),
    );
  }

  const loadingIndicator = document.getElementById("loadingIndicator");
  const hasBaseLayerPicker = !Cesium.defined(baseLayer);

  const terrain = Cesium.Terrain.fromWorldTerrain({
    requestWaterMask: true,
    requestVertexNormals: true,
  });

  let viewer: Cesium.Viewer;
  try {
    viewer = new Cesium.Viewer("cesiumContainer", {
      baseLayer: baseLayer,
      baseLayerPicker: hasBaseLayerPicker,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      scene3DOnly: endUserOptions.scene3DOnly,
      selectionIndicator: false,
      requestRenderMode: true,
      terrain: terrain,
    });

    // Set tilt event type as RIGHT_DRAG
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [
      Cesium.CameraEventType.RIGHT_DRAG,
      Cesium.CameraEventType.PINCH,
      {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL,
      },
      {
        eventType: Cesium.CameraEventType.RIGHT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL,
      },
    ];
    // Set zoom event type as MIDDLE_DRAG
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [
      Cesium.CameraEventType.MIDDLE_DRAG,
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
    ];

    if (hasBaseLayerPicker) {
      const viewModel = viewer.baseLayerPicker.viewModel;
      viewModel.selectedTerrain = viewModel.terrainProviderViewModels[1];
    }

    (viewer.timeline.container as HTMLElement).style.display = "none";
    (viewer.animation.container as HTMLElement).style.display = "none";
  } catch (exception) {
    if (loadingIndicator) loadingIndicator.style.display = "none";
    const message = Cesium.formatError(exception);
    console.error(message);
    if (!document.querySelector(".cesium-widget-errorPanel")) {
      window.alert(message);
    }
    return;
  }

  viewer.extend(Cesium.viewerDragDropMixin);
  if (endUserOptions.inspector) {
    viewer.extend(Cesium.viewerCesiumInspectorMixin);
  }

  const showLoadError = function (name: string, error: any) {
    const title = `An error occurred while loading the file: ${name}`;
    const message =
      "An error occurred while loading the file, which may indicate that it is invalid.  A detailed error report is below:";
    viewer.cesiumWidget.showErrorPanel(title, message, error);
  };

  const scene = viewer.scene;

  const view = endUserOptions.view;
  const source = endUserOptions.source;
  if (Cesium.defined(source)) {
    let sourceType = endUserOptions.sourceType;
    if (!Cesium.defined(sourceType)) {
      // autodetect using file extension if not specified
      if (/\.czml$/i.test(source)) {
        sourceType = "czml";
      } else if (
        /\.geojson$/i.test(source) ||
        /\.json$/i.test(source) ||
        /\.topojson$/i.test(source)
      ) {
        sourceType = "geojson";
      } else if (/\.kml$/i.test(source) || /\.kmz$/i.test(source)) {
        sourceType = "kml";
      } else if (/\.gpx$/i.test(source)) {
        sourceType = "gpx";
      }
    }

    let loadPromise;
    if (sourceType === "czml") {
      loadPromise = Cesium.CzmlDataSource.load(source);
    } else if (sourceType === "geojson") {
      loadPromise = Cesium.GeoJsonDataSource.load(source);
    } else if (sourceType === "kml") {
      loadPromise = Cesium.KmlDataSource.load(source, {
        camera: scene.camera,
        canvas: scene.canvas,
        screenOverlayContainer: viewer.container,
      });
    } else if (sourceType === "gpx") {
      loadPromise = Cesium.GpxDataSource.load(source);
    } else {
      showLoadError(source, "Unknown format.");
    }

    if (Cesium.defined(loadPromise)) {
      try {
        const dataSource = await viewer.dataSources.add(loadPromise);
        const lookAt = endUserOptions.lookAt;
        if (Cesium.defined(lookAt)) {
          const entity = dataSource.entities.getById(lookAt);
          if (Cesium.defined(entity)) {
            viewer.trackedEntity = entity;
          } else {
            const error = `No entity with id "${lookAt}" exists in the provided data source.`;
            showLoadError(source, error);
          }
        } else if (!Cesium.defined(view) && endUserOptions.flyTo !== "false") {
          viewer.flyTo(dataSource);
        }
      } catch (error) {
        showLoadError(source, error);
      }
    }
  }

  if (endUserOptions.stats) {
    scene.debugShowFramesPerSecond = true;
  }

  const theme = endUserOptions.theme;
  if (Cesium.defined(theme)) {
    if (endUserOptions.theme === "lighter") {
      document.body.classList.add("cesium-lighter");
      viewer.animation.applyThemeChanges();
    } else {
      const error = `Unknown theme: ${theme}`;
      viewer.cesiumWidget.showErrorPanel(error, "");
    }
  }

  if (Cesium.defined(view)) {
    const splitQuery = view.split(/[ ,]+/);
    if (splitQuery.length > 1) {
      const longitude = !isNaN(+splitQuery[0]) ? +splitQuery[0] : 0.0;
      const latitude = !isNaN(+splitQuery[1]) ? +splitQuery[1] : 0.0;
      const height =
        splitQuery.length > 2 && !isNaN(+splitQuery[2])
          ? +splitQuery[2]
          : 300.0;
      const heading =
        splitQuery.length > 3 && !isNaN(+splitQuery[3])
          ? Cesium.Math.toRadians(+splitQuery[3])
          : undefined;
      const pitch =
        splitQuery.length > 4 && !isNaN(+splitQuery[4])
          ? Cesium.Math.toRadians(+splitQuery[4])
          : undefined;
      const roll =
        splitQuery.length > 5 && !isNaN(+splitQuery[5])
          ? Cesium.Math.toRadians(+splitQuery[5])
          : undefined;

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: roll,
        },
      });
    }
  }

  const camera = viewer.camera;
  function saveCamera() {
    const position = camera.positionCartographic;
    let hpr = "";
    if (Cesium.defined(camera.heading)) {
      hpr = `,${Cesium.Math.toDegrees(camera.heading)},${Cesium.Math.toDegrees(
        camera.pitch,
      )},${Cesium.Math.toDegrees(camera.roll)}`;
    }
    endUserOptions.view = `${Cesium.Math.toDegrees(
      position.longitude,
    )},${Cesium.Math.toDegrees(position.latitude)},${position.height}${hpr}`;
    history.replaceState(
      undefined,
      "",
      `?${Cesium.objectToQuery(endUserOptions)}`,
    );
  }

  let timeout: number | undefined;
  if (endUserOptions.saveCamera !== "false") {
    camera.changed.addEventListener(function () {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(saveCamera, 1000);
    });
  }

  if (loadingIndicator) loadingIndicator.style.display = "none";

  window.viewer = viewer;
}

main();
