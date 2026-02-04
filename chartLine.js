

let lineCanvas = null;
let lineCtx = null;

let miniCanvas = null;
let miniCtx = null;

let fullLabels = [];
let fullDatasets = []; // [{ label, data: number[], color }]
let currentRange = { start: 0, end: 0 };

// Cached visible slice
let visibleLabels = [];
let visibleDatasets = [];

// Plot area inside the line canvas (pixels)
let plotArea = { left: 70, right: 0, top: 70, bottom: 70 };

// Hover state
let hoverIndex = null; // index into visibleLabels
let hoverX = 0;
let hoverY = 0;

let isDragging = false;
let dragMode = null;
let activeHandle = null;


window.addEventListener("mouseup", handleLineMouseUp);
window.addEventListener("mouseleave", handleLineMouseUp);


function handleLineMouseUp() {
  isDragging = false;
  dragMode = null;       // left handle / right handle / center
  activeHandle = null;  // if you use one
}



// Event markers (same data as before)
const eventMarkers = [
  {
    company: "AMAZON",
    date: "2011 Q4",
    title: "Kindle Fire Launch",
    link: "https://en.wikipedia.org/wiki/Amazon_Fire_tablet",
    color: "#FF9900"
  },
  {
    company: "NETFLIX",
    date: "2007 Q1",
    title: "Streaming Launch",
    link: "https://en.wikipedia.org/wiki/Netflix#Streaming_media",
    color: "#E50914"
  },
  {
    company: "DISNEY",
    date: "2019 Q4",
    title: "Disney+ Launch",
    link: "https://en.wikipedia.org/wiki/Disney%2B",
    color: "#3B82F6"
  },
  {
    company: "SPOTIFY",
    date: "2015 Q1",
    title: "Global Expansion",
    link: "https://en.wikipedia.org/wiki/Spotify",
    color: "#1DB954"
  },
  {
    company: "HBO",
    date: "2015 Q2",
    title: "HBO Now Launch",
    link: "https://en.wikipedia.org/wiki/HBO_Max",
    color: "#8B5CF6"
  }
];

// Cached event marker positions for click detection
let markerPositions = []; // [{ x, top, bottom, link }]

// ===========================
// INITIALISATION
// ===========================

function initLineChart() {
  lineCanvas = document.getElementById("comparisonChart");
  if (!lineCanvas) {
    console.error('No canvas found with id="comparisonChart"');
    return;
  }

  lineCtx = lineCanvas.getContext("2d");

  resizeLineCanvas();
  window.addEventListener("resize", () => {
    resizeLineCanvas();
    renderLineChart();
  });

  lineCanvas.addEventListener("mousemove", handleLineMouseMove);
  lineCanvas.addEventListener("mouseleave", handleLineMouseLeave);
  lineCanvas.addEventListener("click", handleLineClick);

  // Initial render (may be empty until selections are made)
  renderLineChart();
}

function resizeLineCanvas() {
  if (!lineCanvas) return;
  const container = lineCanvas.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  lineCanvas.width = rect.width;
  // Use a fixed-ish height that matches previous look
  lineCanvas.height = Math.max(350, rect.height || 400);

  plotArea.left = 70;
  plotArea.right = lineCanvas.width - 30;
  plotArea.top = 70;
  plotArea.bottom = lineCanvas.height - 70;
}

// ===========================
// DATA UPDATE
// ===========================

function updateLineChart() {
  if (!lineCtx) {
    initLineChart();
  }
  const selectedStreams = window.mediaData.selectedStreams;

  if (!selectedStreams || selectedStreams.size === 0) {
    fullLabels = [];
    fullDatasets = [];
    visibleLabels = [];
    visibleDatasets = [];
    currentRange = { start: 0, end: 0 };
    renderLineChart();
    updateRangeSelector();
    return;
  }

  // Collect all unique quarter labels across all companies and sort them
  const allLabelsSet = new Set();
  const companyDataMap = new Map();

  selectedStreams.forEach((stream) => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;

    const series = window.mediaUtils.extractSeries(company);
    companyDataMap.set(company, series);

    series.labels.forEach((label) => allLabelsSet.add(label));
  });

  const sortedLabels = Array.from(allLabelsSet).sort((a, b) => {
    const [yearA, quarterA] = a.split(" Q");
    const [yearB, quarterB] = b.split(" Q");
    const dateA = parseInt(yearA, 10) * 10 + parseInt(quarterA, 10);
    const dateB = parseInt(yearB, 10) * 10 + parseInt(quarterB, 10);
    return dateA - dateB;
  });

  const datasets = [];

  selectedStreams.forEach((stream) => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;

    const series = companyDataMap.get(company);
    if (!series) return;

    const dataMap = new Map();
    series.labels.forEach((label, i) => {
      dataMap.set(label, series.values[i]);
    });

    const mappedData = sortedLabels.map((label) =>
      dataMap.has(label) ? dataMap.get(label) : null
    );

    datasets.push({
      label: company,
      data: mappedData,
      color: window.mediaUtils.companyColors[company] || "#ffffff"
    });
  });

  fullLabels = sortedLabels;
  fullDatasets = datasets;

  currentRange = { start: 0, end: fullLabels.length - 1 };
  visibleLabels = fullLabels.slice();
  visibleDatasets = fullDatasets.map((ds) => ({
    ...ds,
    data: ds.data.slice()
  }));

  renderLineChart();
  updateRangeSelector();
}

// ===========================
// RENDERING
// ===========================

function renderLineChart() {
  if (!lineCtx || !lineCanvas) return;

  // Clear background
  lineCtx.fillStyle = "#1a1a1a";
  lineCtx.fillRect(0, 0, lineCanvas.width, lineCanvas.height);

  // Title
  lineCtx.fillStyle = "#ffffff";
  lineCtx.font = "16px Arial";
  lineCtx.textAlign = "center";
  lineCtx.textBaseline = "top";
  lineCtx.fillText(
    "Subscriber Growth Over Time",
    lineCanvas.width / 2,
    20
  );

  if (!visibleLabels || visibleLabels.length === 0 || !visibleDatasets.length) {
    // No data, nothing more to draw
    markerPositions = [];
    return;
  }

  // Compute scales
  const { left, right, top, bottom } = plotArea;
  const plotWidth = right - left;
  const plotHeight = bottom - top;

  // Y range (start at 0)
  let maxY = 0;
  visibleDatasets.forEach((ds) => {
    ds.data.forEach((v) => {
      if (v != null && v > maxY) maxY = v;
    });
  });
  if (maxY === 0) maxY = 1;

  // Round maxY up to a nice tick
  const exponent = Math.floor(Math.log10(maxY));
  const base = Math.pow(10, exponent);
  const niceMax = Math.ceil(maxY / base) * base;
  maxY = niceMax;

  const yTicks = 5;

  // Draw Y grid and labels
  lineCtx.strokeStyle = "rgba(255,255,255,0.1)";
  lineCtx.fillStyle = "#ffffff";
  lineCtx.lineWidth = 1;
  lineCtx.textAlign = "right";
  lineCtx.textBaseline = "middle";
  lineCtx.font = "12px Arial";

  for (let i = 0; i <= yTicks; i++) {
    const t = i / yTicks;
    const yVal = maxY * t;
    const y = bottom - t * plotHeight;

    // Grid line
    lineCtx.beginPath();
    lineCtx.moveTo(left, y);
    lineCtx.lineTo(right, y);
    lineCtx.stroke();

    // Label
    lineCtx.fillText(yVal.toFixed(0), left - 10, y);
  }

  // Axis labels
  // Y axis title
  lineCtx.save();
  lineCtx.translate(20, (top + bottom) / 2);
  lineCtx.rotate(-Math.PI / 2);
  lineCtx.textAlign = "center";
  lineCtx.textBaseline = "top";
  lineCtx.font = "12px Arial";
  lineCtx.fillText("Subscribers (Millions)", 0, 0);
  lineCtx.restore();

  // X axis title
  lineCtx.textAlign = "center";
  lineCtx.textBaseline = "bottom";
  lineCtx.font = "12px Arial";
  lineCtx.fillText("Year / Quarter", (left + right) / 2, bottom + 40);

  // X labels and lines
  const n = visibleLabels.length;
  const stepX = n > 1 ? plotWidth / (n - 1) : 0;

  lineCtx.textAlign = "right";
  lineCtx.textBaseline = "top";
  lineCtx.font = "10px Arial";
  lineCtx.fillStyle = "#ffffff";

  const maxLabels = 16;
  const labelEvery = Math.ceil(n / maxLabels) || 1;

  for (let i = 0; i < n; i++) {
    const x = left + i * stepX;

    // X grid (vertical lines)
    lineCtx.strokeStyle = "rgba(255,255,255,0.08)";
    lineCtx.beginPath();
    lineCtx.moveTo(x, top);
    lineCtx.lineTo(x, bottom);
    lineCtx.stroke();

    if (i % labelEvery === 0 || i === n - 1 || i === 0) {
      const label = visibleLabels[i];
      lineCtx.save();
      lineCtx.translate(x, bottom + 5);
      lineCtx.rotate(-Math.PI / 4);
      lineCtx.fillText(label, 0, 0);
      lineCtx.restore();
    }
  }

  // Helper: map data value to Y pixel
  function yToPixel(v) {
    const t = v / maxY;
    return bottom - t * plotHeight;
  }

  // Draw lines
visibleDatasets.forEach((ds) => {
  lineCtx.strokeStyle = ds.color;
  lineCtx.lineWidth = 3;
  lineCtx.beginPath();

  let lastX = null;
  let lastY = null;

  for (let i = 0; i < n; i++) {
    const v = ds.data[i];
    if (v == null) continue;

    const x = left + i * stepX;
    const y = yToPixel(v);

    if (lastX == null) {
      lineCtx.moveTo(x, y);
    } else {
      lineCtx.lineTo(x, y);
    }

    lastX = x;
    lastY = y;
  }

  lineCtx.stroke();
});



  // Draw points (for hover feedback)
  visibleDatasets.forEach((ds) => {
    lineCtx.fillStyle = ds.color;
    for (let i = 0; i < n; i++) {
      const v = ds.data[i];
      if (v == null) continue;
      const x = left + i * stepX;
      const y = yToPixel(v);
      const r = 3;
      lineCtx.beginPath();
      lineCtx.arc(x, y, r, 0, Math.PI * 2);
      lineCtx.fill();
    }
  });

  // Hover tooltip (index mode, like Chart.js)
  if (hoverIndex != null && hoverIndex >= 0 && hoverIndex < n) {
    drawHoverTooltip(hoverIndex, left, stepX, yToPixel, plotTop = top);
  }

  // Event markers (draw on canvas)
  drawEventMarkersOnCanvas(left, right, top, bottom, stepX);
}

function drawHoverTooltip(index, left, stepX, yToPixel, plotTop) {
  const x = left + index * stepX;

  const values = [];
  visibleDatasets.forEach((ds) => {
    const v = ds.data[index];
    if (v != null) {
      values.push({
        label: ds.label,
        value: v,
        color: ds.color
      });
    }
  });

  if (!values.length) return;

  const label = visibleLabels[index];

  // Vertical hover line
  lineCtx.strokeStyle = "rgba(255,255,255,0.3)";
  lineCtx.lineWidth = 1;
  lineCtx.beginPath();
  lineCtx.moveTo(x, plotTop);
  lineCtx.lineTo(x, plotArea.bottom);
  lineCtx.stroke();

  // Tooltip content
  const padding = 10;
  const lineHeight = 18;
  const fontSize = 12;
  lineCtx.font = `${fontSize}px Arial`;

  const lines = [
    label,
    ...values.map((v) => `${v.label}: ${v.value}M subscribers`)
  ];

  let maxWidth = 0;
  lines.forEach((line) => {
    const w = lineCtx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  });

  const boxWidth = maxWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  let boxX = hoverX + 15;
  let boxY = hoverY - boxHeight - 10;

  if (boxX + boxWidth > lineCanvas.width) {
    boxX = hoverX - boxWidth - 15;
  }
  if (boxY < 0) {
    boxY = hoverY + 20;
  }

  // Background
  lineCtx.fillStyle = "rgba(0,0,0,0.9)";
  lineCtx.strokeStyle = "#3B82F6";
  lineCtx.lineWidth = 2;

  const r = 6;
  lineCtx.beginPath();
  lineCtx.moveTo(boxX + r, boxY);
  lineCtx.lineTo(boxX + boxWidth - r, boxY);
  lineCtx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
  lineCtx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
  lineCtx.quadraticCurveTo(
    boxX + boxWidth,
    boxY + boxHeight,
    boxX + boxWidth - r,
    boxY + boxHeight
  );
  lineCtx.lineTo(boxX + r, boxY + boxHeight);
  lineCtx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
  lineCtx.lineTo(boxX, boxY + r);
  lineCtx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
  lineCtx.closePath();
  lineCtx.fill();
  lineCtx.stroke();

  // Text
  lineCtx.textAlign = "left";
  lineCtx.textBaseline = "top";

  lines.forEach((line, i) => {
    const y = boxY + padding + i * lineHeight;
    if (i === 0) {
      lineCtx.fillStyle = "#ffffff";
      lineCtx.font = "bold 12px Arial";
    } else {
      lineCtx.fillStyle = "#ffffff";
      lineCtx.font = "12px Arial";
    }
    lineCtx.fillText(line, boxX + padding, y);
  });
}

// ===========================
// EVENT MARKERS (CANVAS)
// ===========================

function drawEventMarkersOnCanvas(left, right, top, bottom, stepX) {
  markerPositions = [];
  if (!visibleLabels || !visibleLabels.length) return;

  const selectedStreams = window.mediaData.selectedStreams || new Set();

  eventMarkers.forEach((event) => {
    if (!selectedStreams.has(event.company)) return;
    const globalIndex = fullLabels.indexOf(event.date);
    if (globalIndex === -1) return;

    // Map global index to visible index
    const visibleIndex = globalIndex - currentRange.start;
    if (visibleIndex < 0 || visibleIndex >= visibleLabels.length) return;

    const x = left + visibleIndex * stepX;

    // Vertical line
    lineCtx.strokeStyle = event.color;
    lineCtx.lineWidth = 2;
    lineCtx.globalAlpha = 0.4;
    lineCtx.beginPath();
    lineCtx.moveTo(x, top);
    lineCtx.lineTo(x, bottom);
    lineCtx.stroke();
    lineCtx.globalAlpha = 1;

    // Dot at top
    lineCtx.fillStyle = event.color;
    lineCtx.strokeStyle = "#1a1a1a";
    lineCtx.lineWidth = 2;
    lineCtx.beginPath();
    lineCtx.arc(x, top - 4, 4, 0, Math.PI * 2);
    lineCtx.fill();
    lineCtx.stroke();

    markerPositions.push({
      x,
      top,
      bottom,
      link: event.link
    });
  });
}

// ===========================
// RANGE SELECTOR + MINI CHART
// ===========================

function updateRangeSelector() {
  let rangeContainer = document.getElementById("rangeSelector");

  if (!rangeContainer) {
    const chartContainer = document.getElementById("comparisonChart").parentElement;
    rangeContainer = document.createElement("div");
    rangeContainer.id = "rangeSelector";
    rangeContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: 80px;
      margin-top: 20px;
      background: #0d0d0d;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    chartContainer.appendChild(rangeContainer);
  }

  if (!fullLabels.length) {
    rangeContainer.innerHTML = "";
    return;
  }

  rangeContainer.innerHTML = `
    <canvas id="miniChart" style="width: 100%; height: 100%;"></canvas>
    <div id="rangeOverlay" style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    ">
      <div id="leftMask" style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: rgba(13, 13, 13, 0.85);
        pointer-events: auto;
      "></div>
      <div id="rangeWindow" style="
        position: absolute;
        top: 0;
        bottom: 0;
        border-left: 3px solid #3B82F6;
        border-right: 3px solid #3B82F6;
        background: rgba(59, 130, 246, 0.15);
        cursor: move;
        pointer-events: auto;
      ">
        <div id="leftHandle" style="
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 40px;
          background: #3B82F6;
          cursor: ew-resize;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        "></div>
        <div id="rightHandle" style="
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 40px;
          background: #3B82F6;
          cursor: ew-resize;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        "></div>
      </div>
      <div id="rightMask" style="
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(13, 13, 13, 0.85);
        pointer-events: auto;
      "></div>
    </div>
  `;

  miniCanvas = document.getElementById("miniChart");
  if (!miniCanvas) return;
  miniCtx = miniCanvas.getContext("2d");

  const rect = rangeContainer.getBoundingClientRect();
  miniCanvas.width = rect.width;
  miniCanvas.height = rect.height;

  renderMiniChart();

  const rangeWindow = document.getElementById("rangeWindow");
  const leftMask = document.getElementById("leftMask");
  const rightMask = document.getElementById("rightMask");
  const leftHandle = document.getElementById("leftHandle");
  const rightHandle = document.getElementById("rightHandle");

  rangeWindow.style.left = "0%";
  rangeWindow.style.right = "0%";
  leftMask.style.width = "0%";
  rightMask.style.width = "0%";


  let startX = 0;
  let startLeft = 0;
  let startRight = 0;

  function applyRange(leftPercent, rightPercent) {
    leftPercent = Math.max(0, Math.min(100 - rightPercent, leftPercent));
    rightPercent = Math.max(0, Math.min(100 - leftPercent, rightPercent));

    rangeWindow.style.left = leftPercent + "%";
    rangeWindow.style.right = rightPercent + "%";
    leftMask.style.width = leftPercent + "%";
    rightMask.style.width = rightPercent + "%";

    const totalPoints = fullLabels.length;
    const startIdx = Math.floor((leftPercent / 100) * totalPoints);
    const endIdx =
      Math.ceil(((100 - rightPercent) / 100) * totalPoints) - 1;

    currentRange = { start: startIdx, end: endIdx };

    visibleLabels = fullLabels.slice(startIdx, endIdx + 1);
    visibleDatasets = fullDatasets.map((ds) => ({
      ...ds,
      data: ds.data.slice(startIdx, endIdx + 1)
    }));

    renderLineChart();
  }

  leftHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragMode = "left";
    startX = e.clientX;
    startLeft = parseFloat(rangeWindow.style.left);
    e.stopPropagation();
  });

  rightHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragMode = "right";
    startX = e.clientX;
    startRight = parseFloat(rangeWindow.style.right);
    e.stopPropagation();
  });

  rangeWindow.addEventListener("mousedown", (e) => {
    if (e.target === rangeWindow) {
      isDragging = true;
      dragMode = "window";
      startX = e.clientX;
      startLeft = parseFloat(rangeWindow.style.left);
      startRight = parseFloat(rangeWindow.style.right);
    }
  });

  document.addEventListener("mousemove", onMouseMoveRange);
  document.addEventListener("mouseup", onMouseUpRange);

  function onMouseMoveRange(e) {
    if (!isDragging) return;

    const containerWidth = rangeContainer.offsetWidth;
    const deltaPercent = ((e.clientX - startX) / containerWidth) * 100;

    if (dragMode === "left") {
      const newLeft = startLeft + deltaPercent;
      applyRange(newLeft, parseFloat(rangeWindow.style.right));
    } else if (dragMode === "right") {
      const newRight = startRight - deltaPercent;
      applyRange(parseFloat(rangeWindow.style.left), newRight);
    } else if (dragMode === "window") {
      const windowWidth = 100 - startLeft - startRight;
      let newLeft = startLeft + deltaPercent;
      if (newLeft < 0) newLeft = 0;
      if (newLeft + windowWidth > 100) newLeft = 100 - windowWidth;
      applyRange(newLeft, 100 - newLeft - windowWidth);
    }
  }

  function onMouseUpRange() {
    isDragging = false;
    dragMode = null;
   
  }
}

function renderMiniChart() {
  if (!miniCtx || !miniCanvas || !fullLabels.length || !fullDatasets.length)
    return;

  miniCtx.fillStyle = "#0d0d0d";
  miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

  const padding = { left: 10, right: 10, top: 10, bottom: 10 };
  const width = miniCanvas.width - padding.left - padding.right;
  const height = miniCanvas.height - padding.top - padding.bottom;

  let maxY = 0;
  fullDatasets.forEach((ds) => {
    ds.data.forEach((v) => {
      if (v != null && v > maxY) maxY = v;
    });
  });
  if (maxY === 0) maxY = 1;

  const n = fullLabels.length;
  const stepX = n > 1 ? width / (n - 1) : 0;

  function yToPixel(v) {
    const t = v / maxY;
    return padding.top + height - t * height;
  }

  fullDatasets.forEach((ds) => {
    miniCtx.strokeStyle = ds.color;
    miniCtx.lineWidth = 1.5;
    miniCtx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = ds.data[i];
      if (v == null) {
        started = false;
        continue;
      }
      const x = padding.left + i * stepX;
      const y = yToPixel(v);
      if (!started) {
        miniCtx.moveTo(x, y);
        started = true;
      } else {
        miniCtx.lineTo(x, y);
      }
    }
    miniCtx.stroke();
  });
}

// ===========================
// INTERACTION HANDLERS
// ===========================

function handleLineMouseMove(e) {
  if (!lineCanvas || !visibleLabels.length) return;
  const rect = lineCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  hoverX = x;
  hoverY = y;

  const { left, right } = plotArea;
  const plotWidth = right - left;
  const n = visibleLabels.length;
  if (x < left || x > right || n <= 1) {
    hoverIndex = null;
    renderLineChart();
    return;
  }

  const stepX = plotWidth / (n - 1);
  const idxFloat = (x - left) / stepX;
  const idx = Math.round(idxFloat);
  if (idx < 0 || idx >= n) {
    hoverIndex = null;
  } else {
    hoverIndex = idx;
  }

  renderLineChart();
}

function handleLineMouseLeave() {
  hoverIndex = null;
  renderLineChart();
}

function handleLineClick(e) {
  if (!markerPositions.length) return;
  const rect = lineCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const hitRadius = 6;
  for (const marker of markerPositions) {
    if (Math.abs(x - marker.x) <= hitRadius && y >= marker.top && y <= marker.bottom) {
      if (marker.link) {
        window.open(marker.link, "_blank");
        return;
      }
    }
  }
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLineChart);
} else {
  initLineChart();
}