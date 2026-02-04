// ===========================
// PURE CANVAS AREA CHART WITH RANGE SELECTOR
// ===========================

let areaCanvas = null;
let areaCtx = null;

let miniAreaCanvas = null;
let miniAreaCtx = null;

let fullAreaLabels = [];
let fullAreaDatasets = [];
let currentAreaRange = { start: 0, end: 0 };

let visibleAreaLabels = [];
let visibleAreaDatasets = [];

let areaPlotArea = { left: 70, right: 0, top: 70, bottom: 70 };

let areaHoverIndex = null;
let areaHoverX = 0;
let areaHoverY = 0;


// ===========================
// INITIALISATION
// ===========================

function initAreaChart() {
  areaCanvas = document.getElementById("areaChart");
  if (!areaCanvas) {
    console.error('No canvas found with id="areaChart"');
    return;
  }

  areaCtx = areaCanvas.getContext("2d");

  resizeAreaCanvas();
  window.addEventListener("resize", () => {
    resizeAreaCanvas();
    renderAreaChart();
  });

  areaCanvas.addEventListener("mousemove", handleAreaMouseMove);
  areaCanvas.addEventListener("mouseleave", handleAreaMouseLeave);

  renderAreaChart();
}

function resizeAreaCanvas() {
  if (!areaCanvas) return;
  const container = areaCanvas.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  areaCanvas.width = rect.width;
  areaCanvas.height = Math.max(350, rect.height || 400);

  areaPlotArea.left = 70;
  areaPlotArea.right = areaCanvas.width - 30;
  areaPlotArea.top = 70;
  areaPlotArea.bottom = areaCanvas.height - 70;
}

// ===========================
// DATA UPDATE
// ===========================

function updateAreaChart() {
  if (!areaCtx) {
    initAreaChart();
  }
  
  const selectedStreams = window.mediaData.selectedStreams;

  if (!selectedStreams || selectedStreams.size === 0) {
    fullAreaLabels = [];
    fullAreaDatasets = [];
    visibleAreaLabels = [];
    visibleAreaDatasets = [];
    currentAreaRange = { start: 0, end: 0 };
    renderAreaChart();
    updateAreaRangeSelector();
    return;
  }

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

  fullAreaLabels = sortedLabels;
  fullAreaDatasets = datasets;

  currentAreaRange = { start: 0, end: fullAreaLabels.length - 1 };
  visibleAreaLabels = fullAreaLabels.slice();
  visibleAreaDatasets = fullAreaDatasets.map((ds) => ({
    ...ds,
    data: ds.data.slice()
  }));

  renderAreaChart();
  updateAreaRangeSelector();
}

// ===========================
// RENDERING
// ===========================

function renderAreaChart() {
  if (!areaCtx || !areaCanvas) return;

  areaCtx.fillStyle = "#1a1a1a";
  areaCtx.fillRect(0, 0, areaCanvas.width, areaCanvas.height);

  areaCtx.fillStyle = "#ffffff";
  areaCtx.font = "16px Arial";
  areaCtx.textAlign = "center";
  areaCtx.textBaseline = "top";
  areaCtx.fillText("Subscriber Growth Over Time", areaCanvas.width / 2, 20);

  if (!visibleAreaLabels || visibleAreaLabels.length === 0 || !visibleAreaDatasets.length) {
    return;
  }

  const { left, right, top, bottom } = areaPlotArea;
  const plotWidth = right - left;
  const plotHeight = bottom - top;

  let maxY = 0;
  visibleAreaDatasets.forEach((ds) => {
    ds.data.forEach((v) => {
      if (v != null && v > maxY) maxY = v;
    });
  });
  if (maxY === 0) maxY = 1;

  const exponent = Math.floor(Math.log10(maxY));
  const base = Math.pow(10, exponent);
  const niceMax = Math.ceil(maxY / base) * base;
  maxY = niceMax;

  const yTicks = 5;

  // Draw Y grid and labels
  areaCtx.strokeStyle = "rgba(255,255,255,0.1)";
  areaCtx.fillStyle = "#ffffff";
  areaCtx.lineWidth = 1;
  areaCtx.textAlign = "right";
  areaCtx.textBaseline = "middle";
  areaCtx.font = "12px Arial";

  for (let i = 0; i <= yTicks; i++) {
    const t = i / yTicks;
    const yVal = maxY * t;
    const y = bottom - t * plotHeight;

    areaCtx.beginPath();
    areaCtx.moveTo(left, y);
    areaCtx.lineTo(right, y);
    areaCtx.stroke();

    areaCtx.fillText(yVal.toFixed(0), left - 10, y);
  }

  // Y axis title
  areaCtx.save();
  areaCtx.translate(20, (top + bottom) / 2);
  areaCtx.rotate(-Math.PI / 2);
  areaCtx.textAlign = "center";
  areaCtx.textBaseline = "top";
  areaCtx.font = "12px Arial";
  areaCtx.fillText("Subscribers (Millions)", 0, 0);
  areaCtx.restore();

  // X axis title
  areaCtx.textAlign = "center";
  areaCtx.textBaseline = "bottom";
  areaCtx.font = "12px Arial";
  areaCtx.fillText("Year / Quarter", (left + right) / 2, bottom + 40);

  const n = visibleAreaLabels.length;
  const stepX = n > 1 ? plotWidth / (n - 1) : 0;

  areaCtx.textAlign = "right";
  areaCtx.textBaseline = "top";
  areaCtx.font = "10px Arial";
  areaCtx.fillStyle = "#ffffff";

  const maxLabels = 16;
  const labelEvery = Math.ceil(n / maxLabels) || 1;

  for (let i = 0; i < n; i++) {
    const x = left + i * stepX;

    areaCtx.strokeStyle = "rgba(255,255,255,0.08)";
    areaCtx.beginPath();
    areaCtx.moveTo(x, top);
    areaCtx.lineTo(x, bottom);
    areaCtx.stroke();

    if (i % labelEvery === 0 || i === n - 1 || i === 0) {
      const label = visibleAreaLabels[i];
      areaCtx.save();
      areaCtx.translate(x, bottom + 5);
      areaCtx.rotate(-Math.PI / 4);
      areaCtx.fillText(label, 0, 0);
      areaCtx.restore();
    }
  }

  function yToPixel(v) {
    const t = v / maxY;
    return bottom - t * plotHeight;
  }

  // Draw filled areas
  visibleAreaDatasets.forEach((ds) => {
    // Create gradient
    const gradient = areaCtx.createLinearGradient(0, top, 0, bottom);
    const color = ds.color;
    gradient.addColorStop(0, color + "80"); // 50% opacity at top
    gradient.addColorStop(1, color + "10"); // 6% opacity at bottom

    areaCtx.fillStyle = gradient;
    areaCtx.beginPath();
    
    let started = false;
    let firstX = 0;
    
    for (let i = 0; i < n; i++) {
      const v = ds.data[i];
      if (v == null) continue;
      
      const x = left + i * stepX;
      const y = yToPixel(v);
      
      if (!started) {
        areaCtx.moveTo(x, bottom);
        areaCtx.lineTo(x, y);
        firstX = x;
        started = true;
      } else {
        areaCtx.lineTo(x, y);
      }
    }
    
    if (started) {
      // Close the path at the bottom
      const lastX = left + (n - 1) * stepX;
      areaCtx.lineTo(lastX, bottom);
      areaCtx.lineTo(firstX, bottom);
      areaCtx.closePath();
      areaCtx.fill();
    }

    // Draw line on top
    areaCtx.strokeStyle = ds.color;
    areaCtx.lineWidth = 3;
    areaCtx.beginPath();
    started = false;
    
    for (let i = 0; i < n; i++) {
      const v = ds.data[i];
      if (v == null) {
        started = false;
        continue;
      }
      const x = left + i * stepX;
      const y = yToPixel(v);
      if (!started) {
        areaCtx.moveTo(x, y);
        started = true;
      } else {
        areaCtx.lineTo(x, y);
      }
    }
    areaCtx.stroke();

    // Draw points
    areaCtx.fillStyle = ds.color;
    for (let i = 0; i < n; i++) {
      const v = ds.data[i];
      if (v == null) continue;
      const x = left + i * stepX;
      const y = yToPixel(v);
      const r = 3;
      areaCtx.beginPath();
      areaCtx.arc(x, y, r, 0, Math.PI * 2);
      areaCtx.fill();
    }
  });

  // Hover tooltip
  if (areaHoverIndex != null && areaHoverIndex >= 0 && areaHoverIndex < n) {
    drawAreaHoverTooltip(areaHoverIndex, left, stepX, yToPixel, top);
  }
}

function drawAreaHoverTooltip(index, left, stepX, yToPixel, plotTop) {
  const x = left + index * stepX;

  const values = [];
  visibleAreaDatasets.forEach((ds) => {
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

  const label = visibleAreaLabels[index];

  areaCtx.strokeStyle = "rgba(255,255,255,0.3)";
  areaCtx.lineWidth = 1;
  areaCtx.beginPath();
  areaCtx.moveTo(x, plotTop);
  areaCtx.lineTo(x, areaPlotArea.bottom);
  areaCtx.stroke();

  const padding = 10;
  const lineHeight = 18;
  const fontSize = 12;
  areaCtx.font = `${fontSize}px Arial`;

  const lines = [
    label,
    ...values.map((v) => `${v.label}: ${v.value}M subscribers`)
  ];

  let maxWidth = 0;
  lines.forEach((line) => {
    const w = areaCtx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  });

  const boxWidth = maxWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  let boxX = areaHoverX + 15;
  let boxY = areaHoverY - boxHeight - 10;

  if (boxX + boxWidth > areaCanvas.width) {
    boxX = areaHoverX - boxWidth - 15;
  }
  if (boxY < 0) {
    boxY = areaHoverY + 20;
  }

  areaCtx.fillStyle = "rgba(0,0,0,0.9)";
  areaCtx.strokeStyle = "#3B82F6";
  areaCtx.lineWidth = 2;

  const r = 6;
  areaCtx.beginPath();
  areaCtx.moveTo(boxX + r, boxY);
  areaCtx.lineTo(boxX + boxWidth - r, boxY);
  areaCtx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
  areaCtx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
  areaCtx.quadraticCurveTo(
    boxX + boxWidth,
    boxY + boxHeight,
    boxX + boxWidth - r,
    boxY + boxHeight
  );
  areaCtx.lineTo(boxX + r, boxY + boxHeight);
  areaCtx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
  areaCtx.lineTo(boxX, boxY + r);
  areaCtx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
  areaCtx.closePath();
  areaCtx.fill();
  areaCtx.stroke();

  areaCtx.textAlign = "left";
  areaCtx.textBaseline = "top";

  lines.forEach((line, i) => {
    const y = boxY + padding + i * lineHeight;
    if (i === 0) {
      areaCtx.fillStyle = "#ffffff";
      areaCtx.font = "bold 12px Arial";
    } else {
      areaCtx.fillStyle = "#ffffff";
      areaCtx.font = "12px Arial";
    }
    areaCtx.fillText(line, boxX + padding, y);
  });
}

// ===========================
// RANGE SELECTOR
// ===========================

function updateAreaRangeSelector() {
  let rangeContainer = document.getElementById("areaRangeSelector");

  if (!rangeContainer) {
    const chartContainer = document.getElementById("areaChart").parentElement;
    rangeContainer = document.createElement("div");
    rangeContainer.id = "areaRangeSelector";
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

  if (!fullAreaLabels.length) {
    rangeContainer.innerHTML = "";
    return;
  }

  rangeContainer.innerHTML = `
    <canvas id="miniAreaChart" style="width: 100%; height: 100%;"></canvas>
    <div id="areaRangeOverlay" style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    ">
      <div id="areaLeftMask" style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: rgba(13, 13, 13, 0.85);
        pointer-events: auto;
      "></div>
      <div id="areaRangeWindow" style="
        position: absolute;
        top: 0;
        bottom: 0;
        border-left: 3px solid #3B82F6;
        border-right: 3px solid #3B82F6;
        background: rgba(59, 130, 246, 0.15);
        cursor: move;
        pointer-events: auto;
      ">
        <div id="areaLeftHandle" style="
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
        <div id="areaRightHandle" style="
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
      <div id="areaRightMask" style="
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(13, 13, 13, 0.85);
        pointer-events: auto;
      "></div>
    </div>
  `;

  miniAreaCanvas = document.getElementById("miniAreaChart");
  if (!miniAreaCanvas) return;
  miniAreaCtx = miniAreaCanvas.getContext("2d");

  const rect = rangeContainer.getBoundingClientRect();
  miniAreaCanvas.width = rect.width;
  miniAreaCanvas.height = rect.height;

  renderMiniAreaChart();

  const rangeWindow = document.getElementById("areaRangeWindow");
  const leftMask = document.getElementById("areaLeftMask");
  const rightMask = document.getElementById("areaRightMask");
  const leftHandle = document.getElementById("areaLeftHandle");
  const rightHandle = document.getElementById("areaRightHandle");

  rangeWindow.style.left = "0%";
  rangeWindow.style.right = "0%";
  leftMask.style.width = "0%";
  rightMask.style.width = "0%";

  let isDragging = false;
  let dragMode = null;
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

    const totalPoints = fullAreaLabels.length;
    const startIdx = Math.floor((leftPercent / 100) * totalPoints);
    const endIdx = Math.ceil(((100 - rightPercent) / 100) * totalPoints) - 1;

    currentAreaRange = { start: startIdx, end: endIdx };

    visibleAreaLabels = fullAreaLabels.slice(startIdx, endIdx + 1);
    visibleAreaDatasets = fullAreaDatasets.map((ds) => ({
      ...ds,
      data: ds.data.slice(startIdx, endIdx + 1)
    }));

    renderAreaChart();
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

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  function onMouseMove(e) {
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

  function onMouseUp() {
    isDragging = false;
    dragMode = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

function renderMiniAreaChart() {
  if (!miniAreaCtx || !miniAreaCanvas || !fullAreaLabels.length || !fullAreaDatasets.length)
    return;

  miniAreaCtx.fillStyle = "#0d0d0d";
  miniAreaCtx.fillRect(0, 0, miniAreaCanvas.width, miniAreaCanvas.height);

  const padding = { left: 10, right: 10, top: 10, bottom: 10 };
  const width = miniAreaCanvas.width - padding.left - padding.right;
  const height = miniAreaCanvas.height - padding.top - padding.bottom;

  let maxY = 0;
  fullAreaDatasets.forEach((ds) => {
    ds.data.forEach((v) => {
      if (v != null && v > maxY) maxY = v;
    });
  });
  if (maxY === 0) maxY = 1;

  const n = fullAreaLabels.length;
  const stepX = n > 1 ? width / (n - 1) : 0;

  function yToPixel(v) {
    const t = v / maxY;
    return padding.top + height - t * height;
  }

  fullAreaDatasets.forEach((ds) => {
    miniAreaCtx.strokeStyle = ds.color;
    miniAreaCtx.lineWidth = 1.5;
    miniAreaCtx.beginPath();
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
        miniAreaCtx.moveTo(x, y);
        started = true;
      } else {
        miniAreaCtx.lineTo(x, y);
      }
    }
    miniAreaCtx.stroke();
  });
}

// ===========================
// INTERACTION HANDLERS
// ===========================

function handleAreaMouseMove(e) {
  if (!areaCanvas || !visibleAreaLabels.length) return;
  const rect = areaCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  areaHoverX = x;
  areaHoverY = y;

  const { left, right } = areaPlotArea;
  const plotWidth = right - left;
  const n = visibleAreaLabels.length;
  if (x < left || x > right || n <= 1) {
    areaHoverIndex = null;
    renderAreaChart();
    return;
  }

  const stepX = plotWidth / (n - 1);
  const idxFloat = (x - left) / stepX;
  const idx = Math.round(idxFloat);
  if (idx < 0 || idx >= n) {
    areaHoverIndex = null;
  } else {
    areaHoverIndex = idx;
  }

  renderAreaChart();
}

function handleAreaMouseLeave() {
  areaHoverIndex = null;
  renderAreaChart();
}

function forceAreaChartResize() {
  if (!areaCanvas) return;

  requestAnimationFrame(() => {
    resizeAreaCanvas();
    renderAreaChart();
  });
}


// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAreaChart);
} else {
  initAreaChart();
}