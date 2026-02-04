//declare variables
let bubbleCanvas = null;
let bubbleCtx = null;
let bubbles = [];
let hoveredBubble = null;
let animationFrameId = null;
let isAnimating = false;

// Simple bubble object with gentle floating animation
function createBubble(company, value, color) {
  const radius = Math.sqrt(value) * 8;
  
  return {
    company: company,
    value: value,
    radius: radius,
    color: color,
    baseX: 0, // Base position (will be set)
    baseY: 0, // Base position (will be set)
    x: 0,     // Current position (for animation)
    y: 0,     // Current position (for animation)
    floatOffset: Math.random() * Math.PI * 2, // Random starting point for float animation
    floatSpeed: 0.5 + Math.random() * 0.5 // Random speed between 0.5 and 1.0
  };
}

// Check if mouse is inside a bubble
function isPointInBubble(x, y, bubble) {
  const dx = x - bubble.x;
  const dy = y - bubble.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= bubble.radius;
}

// Draw a single bubble on the canvas
function drawBubble(bubble, isHovered) {
  const ctx = bubbleCtx;
  
  // Make hovered bubbles brighter
  const opacity = isHovered ? 'CC' : '90';
  
  // Draw shadow
  ctx.beginPath();
  ctx.arc(bubble.x + 2, bubble.y + 2, bubble.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();
  
  // Draw bubble circle
  ctx.beginPath();
  ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
  ctx.fillStyle = bubble.color + opacity;
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = bubble.color;
  ctx.lineWidth = isHovered ? 4 : 3;
  ctx.stroke();
  
  // Draw company name
  ctx.fillStyle = '#fff';
  ctx.font = isHovered ? 'bold 18px Arial' : 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(bubble.company, bubble.x, bubble.y - 5);
  
  // Draw subscriber count
  ctx.font = isHovered ? 'bold 16px Arial' : '14px Arial';
  ctx.fillText(`${bubble.value}M`, bubble.x, bubble.y + 15);
  ctx.shadowBlur = 0;
}

// Position bubbles in a grid layout, accounting for bubble size
function positionBubbles() {
  if (bubbles.length === 0) return;
  
  const canvasWidth = bubbleCanvas.width;
  const canvasHeight = bubbleCanvas.height;
  
  // Find the largest radius to ensure proper spacing
  let maxRadius = 0;
  bubbles.forEach(bubble => {
    if (bubble.radius > maxRadius) maxRadius = bubble.radius;
  });
  
  // Calculate safe margins (bubbles need space for their radius + padding)
  const padding = 20;
  const safeMargin = maxRadius + padding;
  const usableWidth = canvasWidth - (safeMargin * 2);
  const usableHeight = canvasHeight - (safeMargin * 2);
  
  // Simple layout: arrange in rows
  const bubblesPerRow = bubbles.length <= 3 ? bubbles.length : 3;
  const rows = Math.ceil(bubbles.length / bubblesPerRow);
  
  // Calculate spacing with safe margins
  const spacingX = usableWidth / Math.max(1, bubblesPerRow - 1);
  const spacingY = usableHeight / Math.max(1, rows - 1);
  
  bubbles.forEach((bubble, index) => {
    const row = Math.floor(index / bubblesPerRow);
    const col = index % bubblesPerRow;
    
    // Center horizontally if fewer bubbles than columns
    let x, y;
    
    if (bubblesPerRow === 1) {
      // Single column - center it
      x = canvasWidth / 2;
    } else {
      // Multiple columns - space them evenly
      x = safeMargin + (col * spacingX);
    }
    
    if (rows === 1) {
      // Single row - center vertically
      y = canvasHeight / 2;
    } else {
      // Multiple rows - space them evenly
      y = safeMargin + (row * spacingY);
    }
    
    // Set base position (for animation to float around)
    bubble.baseX = x;
    bubble.baseY = y;
    bubble.x = x;
    bubble.y = y;
  });
}

// Update bubble positions for gentle floating animation
function updateBubblePositions() {
  const time = Date.now() * 0.001; // Convert to seconds
  
  bubbles.forEach(bubble => {
    // Skip animation if hovering (keeps it stable)
    if (bubble === hoveredBubble) {
      bubble.x = bubble.baseX;
      bubble.y = bubble.baseY;
      return;
    }
    
    // Gentle floating: small circular motion around base position
    const floatAmount = 8; // How far bubbles float (in pixels)
    const angle = time * bubble.floatSpeed + bubble.floatOffset;
    
    bubble.x = bubble.baseX + Math.cos(angle) * floatAmount;
    bubble.y = bubble.baseY + Math.sin(angle) * floatAmount;
  });
}

// Draw everything on the canvas
function drawChart() {
  if (!bubbleCtx || !bubbleCanvas) return;
  
  // Clear canvas with dark background
  bubbleCtx.fillStyle = '#1a1a1a';
  bubbleCtx.fillRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
  
  // Draw title
  bubbleCtx.fillStyle = '#ffffff';
  bubbleCtx.font = '16px Arial';
  bubbleCtx.textAlign = 'center';
  bubbleCtx.fillText('Current Subscriber Counts', bubbleCanvas.width / 2, 30);
  
  // Update positions for animation
  updateBubblePositions();
  
  // Draw each bubble
  bubbles.forEach(bubble => {
    const isHovered = bubble === hoveredBubble;
    drawBubble(bubble, isHovered);
  });
  
  // Draw tooltip if hovering
  if (hoveredBubble) {
    drawTooltip(hoveredBubble);
  }
}

// Animation loop - simple and gentle
function animate() {
  if (!isAnimating || !bubbleCanvas) return;
  
  drawChart();
  animationFrameId = requestAnimationFrame(animate);
}

// Simple tooltip - just shows basic info
function drawTooltip(bubble) {
  const ctx = bubbleCtx;
  const mouseX = hoveredBubble.mouseX || bubble.x;
  const mouseY = hoveredBubble.mouseY || bubble.y - bubble.radius - 30;
  
  // Get company data for tooltip
  const companyData = window.mediaData.rawData.find(c => c.company_name === bubble.company);
  if (!companyData) return;
  
  // Find latest quarter
  let latestYear = null;
  let latestQuarter = null;
  let latestValue = 0;
  
  companyData.years.forEach(yearObj => {
    yearObj.quarters.forEach(q => {
      latestValue = q.subCountMillion;
      latestYear = yearObj.year;
      latestQuarter = q.quarter;
    });
  });
  
  // Tooltip text
  const lines = [
    bubble.company,
    `Subscribers: ${latestValue}M`,
    `Period: ${latestYear} Q${latestQuarter}`
  ];
  
  // Calculate tooltip size
  const padding = 10;
  const lineHeight = 18;
  const fontSize = 13;
  ctx.font = `${fontSize}px Arial`;
  
  let maxWidth = 0;
  lines.forEach(line => {
    const width = ctx.measureText(line).width;
    if (width > maxWidth) maxWidth = width;
  });
  
  const tooltipWidth = maxWidth + padding * 2;
  const tooltipHeight = lines.length * lineHeight + padding * 2;
  
  // Position tooltip (keep it on screen)
  let tooltipX = mouseX + 15;
  let tooltipY = mouseY - tooltipHeight - 10;
  
  if (tooltipX + tooltipWidth > bubbleCanvas.width) {
    tooltipX = mouseX - tooltipWidth - 15;
  }
  if (tooltipY < 0) {
    tooltipY = mouseY + 30;
  }
  
  // Draw tooltip background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.strokeStyle = bubble.color;
  ctx.lineWidth = 2;
  
  // Simple rounded rectangle (draw manually for compatibility)
  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(tooltipX + radius, tooltipY);
  ctx.lineTo(tooltipX + tooltipWidth - radius, tooltipY);
  ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + radius);
  ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - radius);
  ctx.quadraticCurveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - radius, tooltipY + tooltipHeight);
  ctx.lineTo(tooltipX + radius, tooltipY + tooltipHeight);
  ctx.quadraticCurveTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - radius);
  ctx.lineTo(tooltipX, tooltipY + radius);
  ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + radius, tooltipY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw tooltip text
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  lines.forEach((line, index) => {
    const y = tooltipY + padding + index * lineHeight;
    if (index === 0) {
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = bubble.color;
    } else {
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = '#fff';
    }
    ctx.fillText(line, tooltipX + padding, y);
  });
}

// Initialize the bubble chart
function initBubbleChart() {
  bubbleCanvas = document.getElementById("bubbleChart");
  if (!bubbleCanvas) {
    console.error('No canvas found with id="bubbleChart"');
    return;
  }
  
  bubbleCtx = bubbleCanvas.getContext('2d');
  
  // Set canvas size
  resizeBubbleCanvas();
  window.addEventListener('resize', resizeBubbleCanvas);
  
  // Add mouse event listeners
  bubbleCanvas.addEventListener('mousemove', handleMouseMove);
  bubbleCanvas.addEventListener('mouseleave', handleMouseLeave);
}

// Resize canvas when window resizes
function resizeBubbleCanvas() {
  if (!bubbleCanvas) return;
  
  const container = bubbleCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set canvas size - use actual container dimensions
  bubbleCanvas.width = rect.width;
  bubbleCanvas.height = Math.max(600, rect.height);
  
  // Set display size
  bubbleCanvas.style.width = rect.width + 'px';
  bubbleCanvas.style.height = Math.max(600, rect.height) + 'px';
  
  // Reposition and redraw if we have bubbles
  if (bubbles.length > 0) {
    positionBubbles();
    drawChart();
  }
}

// Handle mouse movement
function handleMouseMove(event) {
  const rect = bubbleCanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // Check which bubble is under the mouse
  let foundHover = false;
  
  // Check from top to bottom (last bubble drawn is on top)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (isPointInBubble(mouseX, mouseY, bubbles[i])) {
      hoveredBubble = bubbles[i];
      hoveredBubble.mouseX = mouseX;
      hoveredBubble.mouseY = mouseY;
      bubbleCanvas.style.cursor = 'pointer';
      foundHover = true;
      break;
    }
  }
  
  // No bubble under mouse
  if (!foundHover) {
    if (hoveredBubble) {
      hoveredBubble = null;
      bubbleCanvas.style.cursor = 'default';
    }
  }
}

// Handle mouse leaving canvas
function handleMouseLeave() {
  if (hoveredBubble) {
    hoveredBubble = null;
    bubbleCanvas.style.cursor = 'default';
  }
}

// Start animation loop
function startAnimation() {
  if (!isAnimating && bubbles.length > 0) {
    isAnimating = true;
    animate();
  }
}

// Stop animation loop
function stopAnimation() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// Update the bubble chart with new data
function updateBubbleChart() {
  const selectedStreams = window.mediaData.selectedStreams;
  
  // Stop animation
  stopAnimation();
  
  // Clear bubbles if nothing selected
  if (selectedStreams.size === 0) {
    bubbles = [];
    hoveredBubble = null;
    if (bubbleCtx && bubbleCanvas) {
      bubbleCtx.fillStyle = '#1a1a1a';
      bubbleCtx.fillRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
    }
    return;
  }
  
  // Make sure canvas is sized correctly
  resizeBubbleCanvas();
  
  // Create bubbles for each selected stream
  bubbles = [];
  
  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const companyData = window.mediaData.rawData.find(c => c.company_name === company);
    if (!companyData) return;
    
    // Find the latest subscriber count
    let latestValue = 0;
    
    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        latestValue = q.subCountMillion;
      });
    });
    
    // Get color for this company
    const color = window.mediaUtils.companyColors[company] || '#000000';
    
    // Create bubble
    const bubble = createBubble(company, latestValue, color);
    bubbles.push(bubble);
  });
  
  // Position bubbles in a grid (accounting for size)
  positionBubbles();
  
  // Draw initial frame
  drawChart();
  
  // Start gentle animation
  startAnimation();
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBubbleChart);
} else {
  initBubbleChart();
}
