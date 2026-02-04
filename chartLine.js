// ===========================
// LINE CHART WITH RANGE SELECTOR AND EVENT MARKERS
// ===========================

let lineChart = null;
let miniChart = null;
let fullLabels = [];
let fullDatasets = [];
let currentRange = { start: 0, end: 0 };

// Event markers for major milestones
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

function initLineChart() {
  const ctx = document.getElementById("comparisonChart");
  if (!ctx) {
    console.error('No canvas found with id="comparisonChart"');
    return;
  }

  lineChart = new Chart(ctx.getContext('2d'), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: '#ffffff',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3B82F6',
          borderWidth: 2,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + 'M subscribers';
              }
              return label;
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: false
            },
            pinch: {
              enabled: false
            },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#ffffff'
          },
          title: {
            display: true,
            text: "Subscribers (Millions)",
            color: '#ffffff'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#ffffff',
            maxRotation: 45,
            minRotation: 45
          },
          title: {
            display: true,
            text: "Year / Quarter",
            color: '#ffffff'
          }
        }
      },
      onClick: (event, activeElements) => {
        // Handle click on event markers
        if (activeElements.length > 0) {
          const datasetIndex = activeElements[0].datasetIndex;
          const index = activeElements[0].index;
          const label = lineChart.data.labels[index];
          const company = lineChart.data.datasets[datasetIndex].label;
          
          const eventMarker = eventMarkers.find(e => 
            e.date === label && e.company === company
          );
          
          if (eventMarker && eventMarker.link) {
            window.open(eventMarker.link, '_blank');
          }
        }
      }
    }
  });
  
  // Create event marker overlay
  createEventMarkerOverlay();
}

function createEventMarkerOverlay() {
  const chartContainer = document.getElementById('comparisonChart').parentElement;
  
  // Check if overlay exists
  if (document.getElementById('eventMarkerOverlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'eventMarkerOverlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  `;
  
  chartContainer.style.position = 'relative';
  chartContainer.appendChild(overlay);
}

function drawEventMarkers() {
  const overlay = document.getElementById('eventMarkerOverlay');
  if (!overlay || !lineChart) return;
  
  // Clear existing markers
  overlay.innerHTML = '';
  
  const selectedStreams = window.mediaData.selectedStreams;
  const canvas = document.getElementById('comparisonChart');
  const chartArea = lineChart.chartArea;
  
  if (!chartArea) return;
  
  eventMarkers.forEach(event => {
    // Only show markers for selected companies
    if (!selectedStreams.has(event.company)) return;
    
    const labelIndex = lineChart.data.labels.indexOf(event.date);
    if (labelIndex === -1) return;
    
    // Calculate x position based on chart area
    const xScale = lineChart.scales.x;
    if (!xScale) return;
    
    const x = xScale.getPixelForValue(labelIndex);
    
    // Create vertical line marker
    const marker = document.createElement('div');
    marker.className = 'event-marker-line';
    marker.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${chartArea.top}px;
      width: 2px;
      height: ${chartArea.bottom - chartArea.top}px;
      background: ${event.color};
      opacity: 0.4;
      pointer-events: auto;
      cursor: pointer;
      transition: opacity 0.2s;
    `;
    
    // Create small indicator dot at top
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      left: 50%;
      top: -4px;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${event.color};
      border: 2px solid #1a1a1a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    marker.appendChild(dot);
    
    // Create tooltip popup
    const tooltip = document.createElement('div');
    tooltip.className = 'event-tooltip';
    tooltip.style.cssText = `
      display: none;
      position: absolute;
      left: 50%;
      top: -10px;
      transform: translateX(-50%) translateY(-100%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      border: 1px solid ${event.color};
      z-index: 1000;
      pointer-events: none;
    `;
    tooltip.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 2px;">${event.title}</div>
      <div style="font-size: 10px; color: #999;">${event.date} • Click for details</div>
    `;
    marker.appendChild(tooltip);
    
    // Hover effects
    marker.addEventListener('mouseenter', () => {
      marker.style.opacity = '0.8';
      marker.style.width = '3px';
      tooltip.style.display = 'block';
    });
    
    marker.addEventListener('mouseleave', () => {
      marker.style.opacity = '0.4';
      marker.style.width = '2px';
      tooltip.style.display = 'none';
    });
    
    // Click to open link
    marker.addEventListener('click', () => {
      if (event.link) {
        window.open(event.link, '_blank');
      }
    });
    
    overlay.appendChild(marker);
  });
}

function updateLineChart() {
  if (!lineChart) {
    initLineChart();
  }

  const selectedStreams = window.mediaData.selectedStreams;

  if (selectedStreams.size === 0) {
    lineChart.data.labels = [];
    lineChart.data.datasets = [];
    fullLabels = [];
    fullDatasets = [];
    lineChart.update();
    updateRangeSelector();
    drawEventMarkers();
    return;
  }

  // Collect all unique quarter labels across all companies and sort them
  const allLabelsSet = new Set();
  const companyDataMap = new Map();

  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const series = window.mediaUtils.extractSeries(company);
    companyDataMap.set(company, series);
    
    series.labels.forEach(label => allLabelsSet.add(label));
  });

  // Sort labels chronologically
  const sortedLabels = Array.from(allLabelsSet).sort((a, b) => {
    const [yearA, quarterA] = a.split(' Q');
    const [yearB, quarterB] = b.split(' Q');
    const dateA = parseInt(yearA) * 10 + parseInt(quarterA);
    const dateB = parseInt(yearB) * 10 + parseInt(quarterB);
    return dateA - dateB;
  });

  const datasets = [];

  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const series = companyDataMap.get(company);
    
    // Create a map of label -> value for quick lookup
    const dataMap = new Map();
    series.labels.forEach((label, i) => {
      dataMap.set(label, series.values[i]);
    });

    // Map data to the sorted timeline, using null for missing points
    const mappedData = sortedLabels.map(label => {
      return dataMap.has(label) ? dataMap.get(label) : null;
    });

    datasets.push({
      label: company,
      data: mappedData,
      tension: 0.4,
      borderWidth: 3,
      borderColor: window.mediaUtils.companyColors[company] || '#000000',
      backgroundColor: window.mediaUtils.companyColors[company] || '#000000',
      fill: false,
      spanGaps: true,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: window.mediaUtils.companyColors[company] || '#000000',
      pointBorderColor: '#1a1a1a',
      pointBorderWidth: 2,
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 3
    });
  });

  // Store full data
  fullLabels = sortedLabels;
  fullDatasets = datasets;
  
  // Initialize range to show all data
  currentRange = { start: 0, end: sortedLabels.length - 1 };
  
  lineChart.data.labels = sortedLabels;
  lineChart.data.datasets = datasets;
  lineChart.update();
  
  // Update range selector
  updateRangeSelector();
  
  // Draw event markers after chart is rendered
  setTimeout(drawEventMarkers, 100);
}

function updateRangeSelector() {
  let rangeContainer = document.getElementById('rangeSelector');
  
  if (!rangeContainer) {
    // Create range selector container if it doesn't exist
    const chartContainer = document.getElementById('comparisonChart').parentElement;
    rangeContainer = document.createElement('div');
    rangeContainer.id = 'rangeSelector';
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
  
  if (fullLabels.length === 0) {
    rangeContainer.innerHTML = '';
    return;
  }
  
  // Create mini chart canvas
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
  
  // Destroy previous mini chart if exists
  if (miniChart) {
    miniChart.destroy();
  }
  
  // Create mini chart with dark theme
  const miniCtx = document.getElementById('miniChart').getContext('2d');
  miniChart = new Chart(miniCtx, {
    type: 'line',
    data: {
      labels: fullLabels,
      datasets: fullDatasets.map(ds => ({
        ...ds,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.4
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        y: {
          display: false,
          beginAtZero: true
        },
        x: {
          display: false
        }
      },
      events: []
    }
  });
  
  // Initialize range window
  const rangeWindow = document.getElementById('rangeWindow');
  const leftMask = document.getElementById('leftMask');
  const rightMask = document.getElementById('rightMask');
  const leftHandle = document.getElementById('leftHandle');
  const rightHandle = document.getElementById('rightHandle');
  
  rangeWindow.style.left = '0%';
  rangeWindow.style.right = '0%';
  leftMask.style.width = '0%';
  rightMask.style.width = '0%';
  
  // Dragging logic
  let isDragging = false;
  let dragMode = null;
  let startX = 0;
  let startLeft = 0;
  let startRight = 0;
  
  function updateRange(leftPercent, rightPercent) {
    leftPercent = Math.max(0, Math.min(100 - rightPercent, leftPercent));
    rightPercent = Math.max(0, Math.min(100 - leftPercent, rightPercent));
    
    rangeWindow.style.left = leftPercent + '%';
    rangeWindow.style.right = rightPercent + '%';
    leftMask.style.width = leftPercent + '%';
    rightMask.style.width = rightPercent + '%';
    
    // Update main chart
    const totalPoints = fullLabels.length;
    const startIdx = Math.floor((leftPercent / 100) * totalPoints);
    const endIdx = Math.ceil(((100 - rightPercent) / 100) * totalPoints) - 1;
    
    currentRange = { start: startIdx, end: endIdx };
    
    const visibleLabels = fullLabels.slice(startIdx, endIdx + 1);
    const visibleDatasets = fullDatasets.map(ds => ({
      ...ds,
      data: ds.data.slice(startIdx, endIdx + 1)
    }));
    
    lineChart.data.labels = visibleLabels;
    lineChart.data.datasets = visibleDatasets;
    lineChart.update('none');
    
    // Redraw event markers
    setTimeout(drawEventMarkers, 50);
  }
  
  leftHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragMode = 'left';
    startX = e.clientX;
    startLeft = parseFloat(rangeWindow.style.left);
    e.stopPropagation();
  });
  
  rightHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragMode = 'right';
    startX = e.clientX;
    startRight = parseFloat(rangeWindow.style.right);
    e.stopPropagation();
  });
  
  rangeWindow.addEventListener('mousedown', (e) => {
    if (e.target === rangeWindow) {
      isDragging = true;
      dragMode = 'window';
      startX = e.clientX;
      startLeft = parseFloat(rangeWindow.style.left);
      startRight = parseFloat(rangeWindow.style.right);
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const containerWidth = rangeContainer.offsetWidth;
    const deltaPercent = ((e.clientX - startX) / containerWidth) * 100;
    
    if (dragMode === 'left') {
      const newLeft = startLeft + deltaPercent;
      updateRange(newLeft, parseFloat(rangeWindow.style.right));
    } else if (dragMode === 'right') {
      const newRight = startRight - deltaPercent;
      updateRange(parseFloat(rangeWindow.style.left), newRight);
    } else if (dragMode === 'window') {
      const windowWidth = 100 - startLeft - startRight;
      let newLeft = startLeft + deltaPercent;
      if (newLeft < 0) newLeft = 0;
      if (newLeft + windowWidth > 100) newLeft = 100 - windowWidth;
      updateRange(newLeft, 100 - newLeft - windowWidth);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragMode = null;
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLineChart);
} else {
  initLineChart();
}