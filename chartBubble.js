// ===========================
// ANIMATED BUBBLE CHART (Like CryptoBubbles)
// ===========================

let bubbleCanvas = null;
let bubbleCtx = null;
let animationFrameId = null;
let bubbles = [];
let isAnimating = false;
let draggedBubble = null;
let hoveredBubble = null;
let mouseX = 0;
let mouseY = 0;

// Bubble class for physics simulation
class Bubble {
  constructor(company, value, color, label, canvasWidth, canvasHeight) {
    this.company = company;
    this.value = value;
    this.radius = Math.sqrt(value) * 8; // Scale radius based on subscribers
    this.color = color;
    this.label = label;
    
    // Random starting position within canvas bounds
    this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
    this.y = Math.random() * (canvasHeight - this.radius * 2) + this.radius;
    
    // Much slower, gentler velocity
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    
    // For collision detection
    this.mass = this.radius;
    
    // Dragging state
    this.isDragging = false;
    this.isHovered = false;
  }
  
  contains(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
  
  update(width, height, bubbles) {
    // Don't apply physics if being dragged
    if (this.isDragging) {
      this.vx = 0;
      this.vy = 0;
      return;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Stronger damping (more friction) for gentler movement
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    // Gentle bounce off walls (much less violent)
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -0.3; // Much less bounce
    }
    if (this.x + this.radius > width) {
      this.x = width - this.radius;
      this.vx *= -0.3;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -0.3;
    }
    if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.vy *= -0.3;
    }
    
    // Collision with other bubbles (gentler)
    bubbles.forEach(other => {
      if (other === this || other.isDragging) return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = this.radius + other.radius;
      
      if (distance < minDist && distance > 0) {
        // Collision detected - push apart gently
        const angle = Math.atan2(dy, dx);
        const targetX = this.x + Math.cos(angle) * minDist;
        const targetY = this.y + Math.sin(angle) * minDist;
        
        // Much gentler collision response
        const ax = (targetX - other.x) * 0.02;
        const ay = (targetY - other.y) * 0.02;
        
        this.vx -= ax;
        this.vy -= ay;
        other.vx += ax;
        other.vy += ay;
      }
    });
    
    // Very gentle drift toward center
    const centerX = width / 2;
    const centerY = height / 2;
    const toCenterX = (centerX - this.x) * 0.0002;
    const toCenterY = (centerY - this.y) * 0.0002;
    this.vx += toCenterX;
    this.vy += toCenterY;
  }
  
  draw(ctx) {
    // Highlight if hovered or dragged
    const isHighlighted = this.isHovered || this.isDragging;
    
    // Draw bubble shadow
    ctx.beginPath();
    ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    // Draw bubble
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color + (isHighlighted ? 'B0' : '90'); // More opaque when highlighted
    ctx.fill();
    
    // Draw border (thicker when highlighted)
    ctx.strokeStyle = this.color;
    ctx.lineWidth = isHighlighted ? 4 : 3;
    ctx.stroke();
    
    // Draw company name
    ctx.fillStyle = '#fff';
    ctx.font = isHighlighted ? 'bold 18px Arial' : 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.company, this.x, this.y - 5);
    
    // Draw value
    ctx.font = isHighlighted ? 'bold 16px Arial' : '14px Arial';
    ctx.fillText(`${this.value}M`, this.x, this.y + 15);
    ctx.shadowBlur = 0;
  }
  
  getTooltipData() {
    const companyData = window.mediaData.rawData.find(c => c.company_name === this.company);
    if (!companyData) return null;
    
    // Get latest quarter info
    let latestYear = null;
    let latestQuarter = null;
    let previousValue = null;
    let growthRate = 0;
    
    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        if (previousValue !== null) {
          growthRate = ((q.subCountMillion - previousValue) / previousValue) * 100;
        }
        previousValue = q.subCountMillion;
        latestYear = yearObj.year;
        latestQuarter = q.quarter;
      });
    });
    
    return {
      company: this.company,
      subscribers: this.value,
      year: latestYear,
      quarter: latestQuarter,
      growthRate: growthRate.toFixed(2)
    };
  }
}

function initBubbleChart() {
  bubbleCanvas = document.getElementById("bubbleChart");
  if (!bubbleCanvas) {
    console.error('No canvas found with id="bubbleChart"');
    return;
  }
  
  bubbleCtx = bubbleCanvas.getContext('2d');
  
  // Set canvas size properly
  resizeBubbleCanvas();
  window.addEventListener('resize', resizeBubbleCanvas);
  
  // Add mouse event listeners
  bubbleCanvas.addEventListener('mousedown', handleMouseDown);
  bubbleCanvas.addEventListener('mousemove', handleMouseMove);
  bubbleCanvas.addEventListener('mouseup', handleMouseUp);
  bubbleCanvas.addEventListener('mouseleave', handleMouseLeave);
}

function resizeBubbleCanvas() {
  if (!bubbleCanvas) return;
  
  const container = bubbleCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set actual canvas resolution
  bubbleCanvas.width = rect.width;
  bubbleCanvas.height = Math.max(600, rect.height);
  
  // Set display size (CSS)
  bubbleCanvas.style.width = rect.width + 'px';
  bubbleCanvas.style.height = Math.max(600, rect.height) + 'px';
}

function getMousePos(event) {
  const rect = bubbleCanvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function handleMouseDown(event) {
  const pos = getMousePos(event);
  
  // Check if clicking on a bubble (reverse order to get topmost)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].contains(pos.x, pos.y)) {
      draggedBubble = bubbles[i];
      draggedBubble.isDragging = true;
      bubbleCanvas.style.cursor = 'grabbing';
      break;
    }
  }
}

function handleMouseMove(event) {
  const pos = getMousePos(event);
  mouseX = pos.x;
  mouseY = pos.y;
  
  // If dragging, move the bubble
  if (draggedBubble) {
    draggedBubble.x = pos.x;
    draggedBubble.y = pos.y;
    return;
  }
  
  // Check for hover
  let foundHover = false;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].contains(pos.x, pos.y)) {
      hoveredBubble = bubbles[i];
      hoveredBubble.isHovered = true;
      bubbleCanvas.style.cursor = 'grab';
      foundHover = true;
      break;
    }
  }
  
  if (!foundHover) {
    if (hoveredBubble) {
      hoveredBubble.isHovered = false;
    }
    hoveredBubble = null;
    bubbleCanvas.style.cursor = 'default';
  }
}

function handleMouseUp() {
  if (draggedBubble) {
    draggedBubble.isDragging = false;
    draggedBubble = null;
    bubbleCanvas.style.cursor = hoveredBubble ? 'grab' : 'default';
  }
}

function handleMouseLeave() {
  if (draggedBubble) {
    draggedBubble.isDragging = false;
    draggedBubble = null;
  }
  if (hoveredBubble) {
    hoveredBubble.isHovered = false;
    hoveredBubble = null;
  }
  bubbleCanvas.style.cursor = 'default';
}

function updateBubbleChart() {
  const selectedStreams = window.mediaData.selectedStreams;
  
  // Stop existing animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isAnimating = false;
  
  if (selectedStreams.size === 0) {
    bubbles = [];
    draggedBubble = null;
    hoveredBubble = null;
    if (bubbleCtx && bubbleCanvas) {
      bubbleCtx.fillStyle = '#1a1a1a';
      bubbleCtx.fillRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
    }
    return;
  }
  
  // Ensure canvas is properly sized
  resizeBubbleCanvas();
  
  // Create bubbles for selected streams
  bubbles = [];
  
  selectedStreams.forEach(stream => {
    const company = window.mediaUtils.streamToCompany(stream);
    if (!company) return;
    
    const companyData = window.mediaData.rawData.find(c => c.company_name === company);
    if (!companyData) return;
    
    // Get the most recent subscriber count
    let latestValue = 0;
    let latestLabel = '';
    
    companyData.years.forEach(yearObj => {
      yearObj.quarters.forEach(q => {
        latestValue = q.subCountMillion;
        latestLabel = `${yearObj.year} Q${q.quarter}`;
      });
    });
    
    const color = window.mediaUtils.companyColors[company] || '#000000';
    const bubble = new Bubble(company, latestValue, color, latestLabel, bubbleCanvas.width, bubbleCanvas.height);
    bubbles.push(bubble);
  });
  
  // Start animation
  if (!isAnimating) {
    isAnimating = true;
    animate();
  }
}

function drawTooltip(ctx, bubble) {
  const tooltipData = bubble.getTooltipData();
  if (!tooltipData) return;
  
  // Tooltip content
  const lines = [
    tooltipData.company,
    `Subscribers: ${tooltipData.subscribers}M`,
    `Period: ${tooltipData.year} Q${tooltipData.quarter}`,
    `Growth: ${tooltipData.growthRate}%`
  ];
  
  // Tooltip dimensions
  const padding = 12;
  const lineHeight = 20;
  const fontSize = 14;
  ctx.font = `${fontSize}px Arial`;
  
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const tooltipWidth = maxWidth + padding * 2;
  const tooltipHeight = lines.length * lineHeight + padding * 2;
  
  // Position tooltip near mouse, but keep it on screen
  let tooltipX = mouseX + 15;
  let tooltipY = mouseY + 15;
  
  if (tooltipX + tooltipWidth > bubbleCanvas.width) {
    tooltipX = mouseX - tooltipWidth - 15;
  }
  if (tooltipY + tooltipHeight > bubbleCanvas.height) {
    tooltipY = mouseY - tooltipHeight - 15;
  }
  
  // Draw tooltip background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.strokeStyle = bubble.color;
  ctx.lineWidth = 2;
  
  // Rounded rectangle
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

function animate() {
  if (!bubbleCtx || !bubbleCanvas || !isAnimating) return;
  
  // Clear canvas with dark background
  bubbleCtx.fillStyle = '#1a1a1a';
  bubbleCtx.fillRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
  
  // Reset hover states
  bubbles.forEach(b => {
    if (b !== hoveredBubble) {
      b.isHovered = false;
    }
  });
  
  // Update and draw all bubbles
  bubbles.forEach(bubble => {
    bubble.update(bubbleCanvas.width, bubbleCanvas.height, bubbles);
    bubble.draw(bubbleCtx);
  });
  
  // Draw tooltip if hovering
  if (hoveredBubble && !draggedBubble) {
    drawTooltip(bubbleCtx, hoveredBubble);
  }
  
  // Continue animation
  animationFrameId = requestAnimationFrame(animate);
}

// Cleanup function
function destroyBubbleChart() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  window.removeEventListener('resize', resizeBubbleCanvas);
  
  if (bubbleCanvas) {
    bubbleCanvas.removeEventListener('mousedown', handleMouseDown);
    bubbleCanvas.removeEventListener('mousemove', handleMouseMove);
    bubbleCanvas.removeEventListener('mouseup', handleMouseUp);
    bubbleCanvas.removeEventListener('mouseleave', handleMouseLeave);
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBubbleChart);
} else {
  initBubbleChart();
}