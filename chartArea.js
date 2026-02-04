// ===========================
// STACKED AREA CHART WITH RANGE SELECTOR
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
      maintainAspectRatio: false,
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
              size: 14,
              weight: 'bold'
            },
            padding: 20,
            boxWidth: 15,
            boxHeight: 15,
            generateLabels: function(chart) {
              // Custom legend labels with better styling
              return chart.data.datasets.map((dataset, i) => ({
                text: dataset.label,
                fillStyle: dataset.borderColor,
                strokeStyle: dataset.borderColor,
                lineWidth: 3,
                hidden: false,
                index: i,
                fontColor: '#ffffff'
              }));
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
            },
            footer: function(tooltipItems) {
              let total = 0;
              tooltipItems.forEach(item => {
                total += item.parsed.y;
              });
              return 'Total Market: ' + total.toFixed(1) + 'M';
            }
          }
        },
        title: {
          display: true,
          text: 'Streaming Market Share Over Time',
          color: '#ffffff',
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: 20
        }
      },
      scales: {
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#ffffff',
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: "Total Subscribers (Millions)",
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          stacked: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#ffffff',
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11
            }
          },
          title: {
            display: true,
            text: "Year / Quarter",
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold'
            }
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

  // Collect all data points with their date keys
  const allDataPoints = new Map();
  
  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const companyData = window.mediaData.rawData.find(c => c.company_name === company);
    if (!companyData) return;
    
    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        const dateKey = yearObj.year * 10 + q.quarter;
        const label = `${yearObj.year} Q${q.quarter}`;
        
        if (!allDataPoints.has(dateKey)) {
          allDataPoints.set(dateKey, {
            label: label,
            companies: new Map()
          });
        }
        
        allDataPoints.get(dateKey).companies.set(company, q.subCountMillion);
      });
    });
  });

  const sortedDateKeys = Array.from(allDataPoints.keys()).sort((a, b) => a - b);
  const sortedLabels = sortedDateKeys.map(key => allDataPoints.get(key).label);

  const datasets = [];
  const companyLastValues = new Map();

  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    companyLastValues.set(company, 0);
    
    const mappedData = sortedDateKeys.map(dateKey => {
      const point = allDataPoints.get(dateKey);
      
      if (point.companies.has(company)) {
        const value = point.companies.get(company);
        companyLastValues.set(company, value);
        return value;
      } else {
        return companyLastValues.get(company);
      }
    });

    datasets.push({
      label: company,
      data: mappedData,
      fill: 'origin',
      backgroundColor: window.mediaUtils.companyColors[company] + '80',
      borderColor: window.mediaUtils.companyColors[company],
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: window.mediaUtils.companyColors[company],
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2
    });
  });

  // Store full data
  fullAreaLabels = sortedLabels;
  fullAreaDatasets = datasets;
  currentAreaRange = { start: 0, end: sortedLabels.length - 1 };

  areaChart.data.labels = sortedLabels;
  areaChart.data.datasets = datasets;
  areaChart.update();
  
  updateAreaRangeSelector();
}

function updateAreaRangeSelector() {
  let rangeContainer = document.getElementById('areaRangeSelector');
  
  if (!rangeContainer) {
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
  
  if (miniAreaChart) {
    miniAreaChart.destroy();
  }
  
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
          stacked: true,
          display: false,
          beginAtZero: true
        },
        x: {
          stacked: true,
          display: false
        }
      },
      events: []
    }
  });
  
  const rangeWindow = document.getElementById('areaRangeWindow');
  const leftMask = document.getElementById('areaLeftMask');
  const rightMask = document.getElementById('areaRightMask');
  const leftHandle = document.getElementById('areaLeftHandle');
  const rightHandle = document.getElementById('areaRightHandle');
  
  rangeWindow.style.left = '0%';
  rangeWindow.style.right = '0%';
  leftMask.style.width = '0%';
  rightMask.style.width = '0%';
  
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