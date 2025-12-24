import * as Cesium from "cesium";

import Sunlight from "@/experimental/sunlight.js";

const { viewer } = window;

// Set up camera view for New York City
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(
    -74.01881302800248,
    40.69114333714821,
    753,
  ),
  orientation: Cesium.HeadingPitchRoll.fromDegrees(
    21.27879878293835,
    -21.34390550872462,
    0.0716951918898415,
  ),
  endTransform: Cesium.Matrix4.IDENTITY,
});

// Load NYC 3D buildings tileset asynchronously
Cesium.Cesium3DTileset.fromIonAssetId(75343).then((tileset) => {
  viewer.scene.primitives.add(tileset);
});

// Initialize sunlight analyzer
const sunlight = new Sunlight(viewer);

// Create UI overlay
const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.top = "10px";
overlay.style.left = "10px";
overlay.style.padding = "15px";
overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
overlay.style.color = "white";
overlay.style.fontFamily = "monospace";
overlay.style.fontSize = "12px";
overlay.style.borderRadius = "5px";
overlay.style.maxWidth = "400px";
overlay.style.zIndex = "1000";
overlay.style.userSelect = "none";
overlay.innerHTML = `
  <h3 style="margin: 0 0 10px 0; font-size: 16px;">🌞 Sunlight Analysis Demo</h3>
  <div style="margin-bottom: 10px; line-height: 1.5;">
    <strong>Instructions:</strong><br/>
    • Click on a building or ground to analyze sunlight<br/>
    • Use time slider to see shadows change throughout the day<br/>
    • Toggle options to visualize sun rays and points
  </div>
  <div style="margin-bottom: 10px;">
    <label style="display: block; margin-bottom: 5px;">
      <input type="checkbox" id="showRays" /> Show Sun Rays
    </label>
    <label style="display: block; margin-bottom: 5px;">
      <input type="checkbox" id="showPoints" /> Show Collision Points
    </label>
    <label style="display: block; margin-bottom: 5px;">
      <input type="checkbox" id="analyzeRange" /> Analyze Day Range (6am-6pm)
    </label>
  </div>
  <div style="margin-bottom: 10px;">
    <label style="display: block; margin-bottom: 5px;">
      Time of Day: <span id="timeLabel">12:00</span>
    </label>
    <input
      type="range"
      id="timeSlider"
      min="0"
      max="23"
      value="12"
      step="0.5"
      style="width: 100%;"
    />
  </div>
  <div style="margin-top: 15px;">
    <button
      id="analyzeButton"
      style="
        width: 100%;
        padding: 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
      "
      disabled
    >
      Click on scene to select point
    </button>
  </div>
`;
document.body.appendChild(overlay);

// Get UI elements
const showRaysCheckbox = document.getElementById(
  "showRays",
) as HTMLInputElement;
const showPointsCheckbox = document.getElementById(
  "showPoints",
) as HTMLInputElement;
const analyzeRangeCheckbox = document.getElementById(
  "analyzeRange",
) as HTMLInputElement;
const timeSlider = document.getElementById("timeSlider") as HTMLInputElement;
const timeLabel = document.getElementById("timeLabel") as HTMLSpanElement;
const analyzeButton = document.getElementById(
  "analyzeButton",
) as HTMLButtonElement;

// Store the selected position for analysis
let selectedPosition: Cesium.Cartesian3 | undefined;

// Update time label when slider changes
timeSlider.addEventListener("input", () => {
  const hours = parseFloat(timeSlider.value);
  const minutes = (hours % 1) * 60;
  const displayHours = Math.floor(hours);
  const displayMinutes = Math.round(minutes);
  timeLabel.textContent = `${displayHours.toString().padStart(2, "0")}:${displayMinutes.toString().padStart(2, "0")}`;

  // Update viewer clock time
  const currentDate = viewer.clock.currentTime;
  const date = Cesium.JulianDate.toGregorianDate(currentDate);
  const newTime = new Cesium.GregorianDate(
    date.year,
    date.month,
    date.day,
    displayHours,
    displayMinutes,
    0,
  );
  viewer.clock.currentTime = Cesium.JulianDate.fromGregorianDate(newTime);
});

// Analyze sunlight at clicked position
async function analyzeSunlight(position: Cesium.Cartesian3) {
  sunlight.clear();

  const options: Sunlight.AnalyzeOptions = {
    debugShowRays: showRaysCheckbox.checked,
    debugShowPoints: showPointsCheckbox.checked,
  };

  const currentTime = viewer.clock.currentTime;

  if (analyzeRangeCheckbox.checked) {
    // Analyze from 6 AM to 6 PM with 1-hour intervals
    const date = Cesium.JulianDate.toGregorianDate(currentTime);
    const startTime = Cesium.JulianDate.fromGregorianDate(
      new Cesium.GregorianDate(date.year, date.month, date.day, 6, 0, 0),
    );
    const endTime = Cesium.JulianDate.fromGregorianDate(
      new Cesium.GregorianDate(date.year, date.month, date.day, 18, 0, 0),
    );

    const timeRange: Sunlight.TimeRange = {
      start: startTime,
      end: endTime,
      step: 3600, // 1 hour in seconds
    };

    console.log("Analyzing day range (6am - 6pm)...");
    const results = await sunlight.analyze(position, timeRange, options);
    console.log("Day range analysis complete:", results);
  } else {
    // Single time analysis
    const result = await sunlight.analyze(position, currentTime, options);
    console.log("Analysis result:", result);
  }
}

// Handle analyze button click
analyzeButton.addEventListener("click", async () => {
  if (!selectedPosition) return;

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";

  try {
    await analyzeSunlight(selectedPosition);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze Sunlight";
  }
});

// Handle clicks on the globe
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(
  (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    // Try to pick a 3D position from the scene
    const position = viewer.scene.pickPosition(click.position);
    if (!position) {
      console.log("No position picked - click on terrain or buildings");
      return;
    }

    // Store the selected position
    selectedPosition = position;

    // Update button state
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze Sunlight";

    // Create detection ellipsoid at selected position
    sunlight.setTargetPoint(position, true, 5);
    // await analyzeSunlight(position);
  },
  Cesium.ScreenSpaceEventType.LEFT_CLICK,
);

// Set initial time to noon
const now = Cesium.JulianDate.now();
const date = Cesium.JulianDate.toGregorianDate(now);
const noonTime = Cesium.JulianDate.fromGregorianDate(
  new Cesium.GregorianDate(date.year, date.month, date.day, 12, 0, 0),
);
viewer.clock.currentTime = noonTime;

// Enable shadows for better visualization
viewer.shadows = true;
viewer.terrainShadows = Cesium.ShadowMode.ENABLED;

console.log("Sunlight demo initialized. Click anywhere to analyze sunlight!");
