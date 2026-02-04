// ===========================
// SIMPLE HEAT MAP - Clean Growth Visualization
// ===========================
let heatmapCanvas = null;
let heatmapCtx = null;

function initHeatmap() {
  heatmapCanvas = document.getElementById("heatmapChart");
  if (!heatmapCanvas) {
    console.error('No canvas found with id="heatmapChart"');
    return;
  }
  heatmapCtx = heatmapCanvas.getContext('2d');
  resizeHeatmapCanvas();
  window.addEventListener('resize', resizeHeatmapCanvas);
}

function resizeHeatmapCanvas() {
  if (!heatmapCanvas) return;
  const container = heatmapCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  heatmapCanvas.width = rect.width;
  heatmapCanvas.height = Math.max(400, rect.height);
}

function updateHeatmap() {
  const selectedStreams = window.mediaData.selectedStreams;
  if (selectedStreams.size === 0) {
    if (heatmapCtx && heatmapCanvas) {
      heatmapCtx.fillStyle = '#1a1a1a';
      heatmapCtx.fillRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    }
    return;
  }

  resizeHeatmapCanvas();

  // Build unified timeline
  const timelineSet = new Set();
  const companiesData = [];

  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;

    const companyData = window.mediaData.rawData.find(c => c.company_name === company);
    if (!companyData) return;

    const companyRow = {
      company: company,
      color: window.mediaUtils.companyColors[company],
      dataByQuarter: new Map()
    };

    let previousValue = null;

    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        const quarterKey = `${yearObj.year} Q${q.quarter}`;
        const currentValue = q.subCountMillion;
        
        let growthRate = 0;
        if (previousValue !== null && previousValue > 0) {
          growthRate = ((currentValue - previousValue) / previousValue) * 100;
        }

        companyRow.dataByQuarter.set(quarterKey, {
          value: currentValue,
          growthRate: growthRate
        });

        timelineSet.add(quarterKey);
        previousValue = currentValue;
      });
    });

    companiesData.push(companyRow);
  });

  // Sort timeline
  const timeline = Array.from(timelineSet).sort((a, b) => {
    const [yearA, qA] = a.split(' Q');
    const [yearB, qB] = b.split(' Q');
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
    return parseInt(qA) - parseInt(qB);
  });

  drawHeatmap(companiesData, timeline);
}

function getColorForGrowth(growthRate) {
  if (growthRate < 0) {
    const intensity = Math.min(Math.abs(growthRate) / 30, 1);
    return `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`;
  } else if (growthRate === 0) {
    return 'rgba(100, 100, 100, 0.4)';
  } else {
    const intensity = Math.min(growthRate / 50, 1);
    return `rgba(34, 197, 94, ${0.4 + intensity * 0.6})`;
  }
}

function drawHeatmap(companiesData, timeline) {
  if (!heatmapCtx || !heatmapCanvas || companiesData.length === 0) return;

  const width = heatmapCanvas.width;
  const height = heatmapCanvas.height;

  // Clear
  heatmapCtx.fillStyle = '#1a1a1a';
  heatmapCtx.fillRect(0, 0, width, height);

  const padding = { top: 60, right: 30, bottom: 60, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const cellWidth = chartWidth / timeline.length;
  const cellHeight = chartHeight / companiesData.length;

  // Title
  heatmapCtx.fillStyle = '#ffffff';
  heatmapCtx.font = '16px Arial';
  heatmapCtx.textAlign = 'center';
  heatmapCtx.fillText('Growth Rate Heat Map', width / 2, 30);

  // Draw cells
  companiesData.forEach((companyRow, rowIndex) => {
    const y = padding.top + rowIndex * cellHeight;

    // Company label
    heatmapCtx.fillStyle = companyRow.color;
    heatmapCtx.font = 'bold 13px Arial';
    heatmapCtx.textAlign = 'right';
    heatmapCtx.textBaseline = 'middle';
    heatmapCtx.fillText(companyRow.company, padding.left - 10, y + cellHeight / 2);

    // Draw quarters
    timeline.forEach((quarterLabel, colIndex) => {
      const x = padding.left + colIndex * cellWidth;
      const quarterData = companyRow.dataByQuarter.get(quarterLabel);

      if (quarterData) {
        heatmapCtx.fillStyle = getColorForGrowth(quarterData.growthRate);
        heatmapCtx.fillRect(x, y, cellWidth - 1, cellHeight - 1);

        // Show percentage if cell big enough
        if (cellWidth > 30 && cellHeight > 20) {
          heatmapCtx.fillStyle = '#ffffff';
          heatmapCtx.font = 'bold 9px Arial';
          heatmapCtx.textAlign = 'center';
          heatmapCtx.textBaseline = 'middle';
          heatmapCtx.fillText(
            quarterData.growthRate.toFixed(0) + '%',
            x + cellWidth / 2,
            y + cellHeight / 2
          );
        }
      } else {
        heatmapCtx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        heatmapCtx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
      }

      // Border
      heatmapCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      heatmapCtx.lineWidth = 1;
      heatmapCtx.strokeRect(x, y, cellWidth - 1, cellHeight - 1);
    });
  });

  // X-axis labels (show every few)
  const labelInterval = Math.max(1, Math.floor(timeline.length / 12));
  heatmapCtx.fillStyle = '#aaa';
  heatmapCtx.font = '10px Arial';
  heatmapCtx.textAlign = 'center';

  timeline.forEach((quarterLabel, index) => {
    if (index % labelInterval === 0) {
      const x = padding.left + index * cellWidth + cellWidth / 2;
      heatmapCtx.save();
      heatmapCtx.translate(x, padding.top + chartHeight + 15);
      heatmapCtx.rotate(-Math.PI / 6);
      heatmapCtx.fillText(quarterLabel, 0, 0);
      heatmapCtx.restore();
    }
  });

  // Simple legend
  const legendY = height - 25;
  const legendWidth = 200;
  const legendX = (width - legendWidth) / 2;

  const gradient = heatmapCtx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 1)');
  gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.4)');
  gradient.addColorStop(1, 'rgba(34, 197, 94, 1)');

  heatmapCtx.fillStyle = gradient;
  heatmapCtx.fillRect(legendX, legendY, legendWidth, 15);

  heatmapCtx.fillStyle = '#aaa';
  heatmapCtx.font = '10px Arial';
  heatmapCtx.textAlign = 'center';
  heatmapCtx.fillText('Negative', legendX, legendY - 5);
  heatmapCtx.fillText('Positive', legendX + legendWidth, legendY - 5);

  setupHeatmapInteraction(companiesData, timeline, padding, cellWidth, cellHeight);
}

let heatmapTooltip = null;

function setupHeatmapInteraction(companiesData, timeline, padding, cellWidth, cellHeight) {
  if (heatmapTooltip) heatmapTooltip.remove();

  heatmapTooltip = document.createElement('div');
  heatmapTooltip.style.cssText = `
    position: absolute;
    display: none;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
  `;
  heatmapCanvas.parentElement.appendChild(heatmapTooltip);

  heatmapCanvas.addEventListener('mousemove', (e) => {
    const rect = heatmapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    let found = false;

    companiesData.forEach((companyRow, rowIndex) => {
      const y = padding.top + rowIndex * cellHeight;
      timeline.forEach((quarterLabel, colIndex) => {
        const x = padding.left + colIndex * cellWidth;

        if (mouseX >= x && mouseX < x + cellWidth && mouseY >= y && mouseY < y + cellHeight) {
          const quarterData = companyRow.dataByQuarter.get(quarterLabel);
          if (quarterData) {
            heatmapTooltip.innerHTML = `
              <div style="color: ${companyRow.color}; font-weight: bold;">${companyRow.company}</div>
              <div>${quarterLabel}</div>
              <div>${quarterData.value}M subscribers</div>
              <div style="color: ${quarterData.growthRate >= 0 ? '#22c55e' : '#ef4444'};">
                ${quarterData.growthRate >= 0 ? '+' : ''}${quarterData.growthRate.toFixed(1)}% growth
              </div>
            `;
            heatmapTooltip.style.display = 'block';
            heatmapTooltip.style.left = (e.clientX -400) + 'px';
            heatmapTooltip.style.top = (e.clientY - 250) + 'px';
            found = true;
          }
        }
      });
    });

    if (!found) heatmapTooltip.style.display = 'none';
  });

  heatmapCanvas.addEventListener('mouseleave', () => {
    heatmapTooltip.style.display = 'none';
  });
}

function destroyHeatmap() {
  window.removeEventListener('resize', resizeHeatmapCanvas);
  if (heatmapTooltip) {
    heatmapTooltip.remove();
    heatmapTooltip = null;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeatmap);
} else {
  initHeatmap();
}