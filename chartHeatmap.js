// ===========================
// HEAT MAP - Growth Rate by Quarter
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
  
  // Set canvas size
  resizeHeatmapCanvas();
  window.addEventListener('resize', resizeHeatmapCanvas);
}

function resizeHeatmapCanvas() {
  if (!heatmapCanvas) return;
  const container = heatmapCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  heatmapCanvas.width = rect.width;
  heatmapCanvas.height = Math.max(400, rect.height);
  
  heatmapCanvas.style.width = rect.width + 'px';
  heatmapCanvas.style.height = Math.max(400, rect.height) + 'px';
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
  
  // Prepare heatmap data
  const heatmapData = [];
  
  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const companyData = window.mediaData.rawData.find(c => c.company_name === company);
    if (!companyData) return;
    
    const companyRow = {
      company: company,
      color: window.mediaUtils.companyColors[company],
      quarters: []
    };
    
    let previousValue = null;
    
    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        const currentValue = q.subCountMillion;
        let growthRate = 0;
        
        if (previousValue !== null && previousValue > 0) {
          growthRate = ((currentValue - previousValue) / previousValue) * 100;
        }
        
        companyRow.quarters.push({
          year: yearObj.year,
          quarter: q.quarter,
          value: currentValue,
          growthRate: growthRate,
          label: `${yearObj.year} Q${q.quarter}`
        });
        
        previousValue = currentValue;
      });
    });
    
    heatmapData.push(companyRow);
  });
  
  drawHeatmap(heatmapData);
}

function getColorForGrowth(growthRate, baseColor) {
  // Normalize growth rate to 0-1 scale
  // Assume -50% to +150% is our range
  const minGrowth = -50;
  const maxGrowth = 150;
  
  let normalized = (growthRate - minGrowth) / (maxGrowth - minGrowth);
  normalized = Math.max(0, Math.min(1, normalized));
  
  // Color scale: red (negative) -> gray (0%) -> green (positive)
  if (growthRate < 0) {
    // Negative growth: darker red
    const intensity = Math.min(Math.abs(growthRate) / 50, 1);
    return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
  } else if (growthRate === 0) {
    // No growth: dark gray
    return 'rgba(100, 100, 100, 0.5)';
  } else {
    // Positive growth: green intensity based on rate
    const intensity = Math.min(growthRate / 100, 1);
    return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
  }
}

function drawHeatmap(heatmapData) {
  if (!heatmapCtx || !heatmapCanvas || heatmapData.length === 0) return;
  
  const width = heatmapCanvas.width;
  const height = heatmapCanvas.height;
  
  // Clear canvas
  heatmapCtx.fillStyle = '#1a1a1a';
  heatmapCtx.fillRect(0, 0, width, height);
  
  // Calculate dimensions
  const padding = { top: 80, right: 40, bottom: 60, left: 120 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find max quarters across all companies
  const maxQuarters = Math.max(...heatmapData.map(d => d.quarters.length));
  
  const cellWidth = chartWidth / maxQuarters;
  const cellHeight = chartHeight / heatmapData.length;
  
  // Draw title
  heatmapCtx.fillStyle = '#ffffff';
  heatmapCtx.font = 'bold 20px Arial';
  heatmapCtx.textAlign = 'center';
  heatmapCtx.fillText('Quarter-over-Quarter Growth Rate Heat Map', width / 2, 30);
  
  // Draw subtitle
  heatmapCtx.font = '14px Arial';
  heatmapCtx.fillStyle = '#999';
  heatmapCtx.fillText('Hover over cells to see detailed growth information', width / 2, 55);
  
  // Track hovered cell for tooltip
  let hoveredCell = null;
  
  // Draw cells
  heatmapData.forEach((companyRow, rowIndex) => {
    const y = padding.top + rowIndex * cellHeight;
    
    // Draw company label
    heatmapCtx.fillStyle = companyRow.color;
    heatmapCtx.font = 'bold 14px Arial';
    heatmapCtx.textAlign = 'right';
    heatmapCtx.textBaseline = 'middle';
    heatmapCtx.fillText(companyRow.company, padding.left - 10, y + cellHeight / 2);
    
    // Draw quarters
    companyRow.quarters.forEach((quarter, colIndex) => {
      const x = padding.left + colIndex * cellWidth;
      
      // Draw cell
      heatmapCtx.fillStyle = getColorForGrowth(quarter.growthRate, companyRow.color);
      heatmapCtx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
      
      // Draw cell border
      heatmapCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      heatmapCtx.lineWidth = 1;
      heatmapCtx.strokeRect(x, y, cellWidth - 1, cellHeight - 1);
      
      // Draw growth rate text if cell is large enough
      if (cellWidth > 40 && cellHeight > 30) {
        heatmapCtx.fillStyle = '#ffffff';
        heatmapCtx.font = 'bold 11px Arial';
        heatmapCtx.textAlign = 'center';
        heatmapCtx.textBaseline = 'middle';
        heatmapCtx.fillText(
          quarter.growthRate.toFixed(1) + '%',
          x + cellWidth / 2,
          y + cellHeight / 2
        );
      }
    });
  });
  
  // Draw x-axis labels (sample every few quarters to avoid crowding)
  const labelInterval = Math.max(1, Math.floor(maxQuarters / 10));
  heatmapCtx.fillStyle = '#ffffff';
  heatmapCtx.font = '11px Arial';
  heatmapCtx.textAlign = 'center';
  heatmapCtx.textBaseline = 'top';
  
  if (heatmapData.length > 0) {
    heatmapData[0].quarters.forEach((quarter, index) => {
      if (index % labelInterval === 0) {
        const x = padding.left + index * cellWidth + cellWidth / 2;
        const y = padding.top + chartHeight + 10;
        heatmapCtx.save();
        heatmapCtx.translate(x, y);
        heatmapCtx.rotate(-Math.PI / 4);
        heatmapCtx.fillText(quarter.label, 0, 0);
        heatmapCtx.restore();
      }
    });
  }
  
  // Draw legend
  drawLegend(padding, width, height);
  
  // Add mouse interaction
  setupHeatmapInteraction(heatmapData, padding, cellWidth, cellHeight);
}

function drawLegend(padding, width, height) {
  const legendY = height - 35;
  const legendWidth = 300;
  const legendHeight = 20;
  const legendX = (width - legendWidth) / 2;
  
  // Draw gradient legend
  const gradient = heatmapCtx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 1)');
  gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.5)');
  gradient.addColorStop(1, 'rgba(34, 197, 94, 1)');
  
  heatmapCtx.fillStyle = gradient;
  heatmapCtx.fillRect(legendX, legendY, legendWidth, legendHeight);
  
  // Legend border
  heatmapCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  heatmapCtx.lineWidth = 1;
  heatmapCtx.strokeRect(legendX, legendY, legendWidth, legendHeight);
  
  // Legend labels
  heatmapCtx.fillStyle = '#ffffff';
  heatmapCtx.font = '11px Arial';
  heatmapCtx.textAlign = 'center';
  heatmapCtx.textBaseline = 'top';
  
  heatmapCtx.fillText('Negative', legendX, legendY + legendHeight + 5);
  heatmapCtx.fillText('0%', legendX + legendWidth / 2, legendY + legendHeight + 5);
  heatmapCtx.fillText('High Growth', legendX + legendWidth, legendY + legendHeight + 5);
}

let heatmapTooltip = null;

function setupHeatmapInteraction(heatmapData, padding, cellWidth, cellHeight) {
  // Remove existing tooltip if any
  if (heatmapTooltip) {
    heatmapTooltip.remove();
  }
  
  // Create tooltip element
  heatmapTooltip = document.createElement('div');
  heatmapTooltip.style.cssText = `
    position: absolute;
    display: none;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
    pointer-events: none;
    z-index: 1000;
    border: 2px solid #3B82F6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  `;
  heatmapCanvas.parentElement.appendChild(heatmapTooltip);
  
  heatmapCanvas.addEventListener('mousemove', (e) => {
    const rect = heatmapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check which cell is hovered
    let found = false;
    
    heatmapData.forEach((companyRow, rowIndex) => {
      const y = padding.top + rowIndex * cellHeight;
      
      companyRow.quarters.forEach((quarter, colIndex) => {
        const x = padding.left + colIndex * cellWidth;
        
        if (mouseX >= x && mouseX < x + cellWidth &&
            mouseY >= y && mouseY < y + cellHeight) {
          
          // Show tooltip
          heatmapTooltip.innerHTML = `
            <div style="font-weight: bold; color: ${companyRow.color}; margin-bottom: 6px;">
              ${companyRow.company}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>${quarter.label}</strong>
            </div>
            <div style="margin-bottom: 4px;">
              Subscribers: <strong>${quarter.value}M</strong>
            </div>
            <div style="color: ${quarter.growthRate >= 0 ? '#22c55e' : '#ef4444'};">
              Growth: <strong>${quarter.growthRate >= 0 ? '+' : ''}${quarter.growthRate.toFixed(2)}%</strong>
            </div>
          `;
          
          heatmapTooltip.style.display = 'block';
          heatmapTooltip.style.left = (e.clientX + -400) + 'px';
          heatmapTooltip.style.top = (e.clientY + -400) + 'px';
          
          heatmapCanvas.style.cursor = 'pointer';
          found = true;
        }
      });
    });
    
    if (!found) {
      heatmapTooltip.style.display = 'none';
      heatmapCanvas.style.cursor = 'default';
    }
  });
  
  heatmapCanvas.addEventListener('mouseleave', () => {
    heatmapTooltip.style.display = 'none';e
    heatmapCanvas.style.cursor = 'default';
  });
}

// Cleanup function
function destroyHeatmap() {
  window.removeEventListener('resize', resizeHeatmapCanvas);
  if (heatmapTooltip) {
    heatmapTooltip.remove();
    heatmapTooltip = null;
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeatmap);
} else {
  initHeatmap();
}