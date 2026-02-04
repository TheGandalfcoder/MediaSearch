// ===========================
// AREA CHART WITH RANGE SELECTOR (Same as line chart, just filled)
// ===========================

let areaChart = null;
let miniAreaChart = null;
let fullAreaLabels = [];
let fullAreaDatasets = [];
let currentAreaRange = { start: 0, end: 0 };

function initAreaChart() {
  const ctx = document.getElementById("areaChart");
  if (!ctx) {
    console.error('No canvas found with id="areaChart"');
    return;
  }

  areaChart = new Chart(ctx.getContext('2d'), {
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
        title: {
          display: true,
          text: 'Subscriber Growth Over Time',
          color: '#ffffff',
          font: {
            size: 16
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          display: false
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
      }
    }
  });
}

function updateAreaChart() {
  if (!areaChart) {
    initAreaChart();
  }

  const selectedStreams = window.mediaData.selectedStreams;

  if (selectedStreams.size === 0) {
    areaChart.data.labels = [];
    areaChart.data.datasets = [];
    fullAreaLabels = [];
    fullAreaDatasets = [];
    areaChart.update();
    updateAreaRangeSelector();
    return;
  }

  // Collect all unique quarter labels across all companies and sort them
  // EXACTLY the same as line chart
  const allLabelsSet = new Set();
  const companyDataMap = new Map();

  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const series = window.mediaUtils.extractSeries(company);
    companyDataMap.set(company, series);
    
    series.labels.forEach(label => allLabelsSet.add(label));
  });

  // Sort labels chronologically (same as line chart)
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

    // Map data to the sorted timeline, using null for missing points (same as line chart)
    const mappedData = sortedLabels.map(label => {
      return dataMap.has(label) ? dataMap.get(label) : null;
    });

    datasets.push({
      label: company,
      data: mappedData,
      tension: 0.4,
      borderWidth: 3,
      borderColor: window.mediaUtils.companyColors[company] || '#000000',
      backgroundColor: (window.mediaUtils.companyColors[company] || '#000000') + '80', // Add transparency (80 = ~50% opacity)
      fill: true, // THIS IS THE ONLY DIFFERENCE - filled instead of false
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
  fullAreaLabels = sortedLabels;
  fullAreaDatasets = datasets;
  
  // Initialize range to show all data
  currentAreaRange = { start: 0, end: sortedLabels.length - 1 };
  
  areaChart.data.labels = sortedLabels;
  areaChart.data.datasets = datasets;
  areaChart.update();
  
  // Update range selector
  updateAreaRangeSelector();
}

function updateAreaRangeSelector() {
  let rangeContainer = document.getElementById('areaRangeSelector');
  
  if (!rangeContainer) {
    // Create range selector container if it doesn't exist
    const chartContainer = document.getElementById('areaChart').parentElement;
    rangeContainer = document.createElement('div');
    rangeContainer.id = 'areaRangeSelector';
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
  
  if (fullAreaLabels.length === 0) {
    rangeContainer.innerHTML = '';
    return;
  }
  
  // Create mini chart canvas
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
  
  // Destroy previous mini chart if exists
  if (miniAreaChart) {
    miniAreaChart.destroy();
  }
  
  // Create mini chart with dark theme (same as line chart)
  const miniCtx = document.getElementById('miniAreaChart').getContext('2d');
  miniAreaChart = new Chart(miniCtx, {
    type: 'line',
    data: {
      labels: fullAreaLabels,
      datasets: fullAreaDatasets.map(ds => ({
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
  const rangeWindow = document.getElementById('areaRangeWindow');
  const leftMask = document.getElementById('areaLeftMask');
  const rightMask = document.getElementById('areaRightMask');
  const leftHandle = document.getElementById('areaLeftHandle');
  const rightHandle = document.getElementById('areaRightHandle');
  
  rangeWindow.style.left = '0%';
  rangeWindow.style.right = '0%';
  leftMask.style.width = '0%';
  rightMask.style.width = '0%';
  
  // Dragging logic (same as line chart)
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
    const totalPoints = fullAreaLabels.length;
    const startIdx = Math.floor((leftPercent / 100) * totalPoints);
    const endIdx = Math.ceil(((100 - rightPercent) / 100) * totalPoints) - 1;
    
    currentAreaRange = { start: startIdx, end: endIdx };
    
    const visibleLabels = fullAreaLabels.slice(startIdx, endIdx + 1);
    const visibleDatasets = fullAreaDatasets.map(ds => ({
      ...ds,
      data: ds.data.slice(startIdx, endIdx + 1)
    }));
    
    areaChart.data.labels = visibleLabels;
    areaChart.data.datasets = visibleDatasets;
    areaChart.update('none');
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
  document.addEventListener('DOMContentLoaded', initAreaChart);
} else {
  initAreaChart();
}
