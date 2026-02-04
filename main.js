document.addEventListener("DOMContentLoaded", () => {
  const rawData = [
    {
      "company_name": "AMAZON",
      "years": [
        {
          "year": 2005,
          "quarters": [
            { "quarter": 1, "subCountMillion": 0.05 },
            { "quarter": 2, "subCountMillion": 0.1 },
            { "quarter": 3, "subCountMillion": 0.08 },
            { "quarter": 4, "subCountMillion": 0.2 }
          ]
        },
        {
          "year": 2006,
          "quarters": [
            { "quarter": 1, "subCountMillion": 0.2 },
            { "quarter": 2, "subCountMillion": 0.3 },
            { "quarter": 3, "subCountMillion": 0.4 },
            { "quarter": 4, "subCountMillion": 0.8 }
          ]
        },
        {
          "year": 2007,
          "quarters": [
            { "quarter": 1, "subCountMillion": 1.0 },
            { "quarter": 2, "subCountMillion": 1.2 },
            { "quarter": 3, "subCountMillion": 1.3 },
            { "quarter": 4, "subCountMillion": 2.1 }
          ]
        },
        {
          "year": 2008,
          "quarters": [
            { "quarter": 1, "subCountMillion": 2.2 },
            { "quarter": 2, "subCountMillion": 2.3 },
            { "quarter": 3, "subCountMillion": 2.5 },
            { "quarter": 4, "subCountMillion": 2.9 }
          ]
        },
        {
          "year": 2009,
          "quarters": [
            { "quarter": 1, "subCountMillion": 3.2 },
            { "quarter": 2, "subCountMillion": 3.4 },
            { "quarter": 3, "subCountMillion": 3.5 },
            { "quarter": 4, "subCountMillion": 3.6 }
          ]
        },
        {
          "year": 2010,
          "quarters": [
            { "quarter": 1, "subCountMillion": 3.7 },
            { "quarter": 2, "subCountMillion": 3.9 },
            { "quarter": 3, "subCountMillion": 4.0 },
            { "quarter": 4, "subCountMillion": 4.2 }
          ]
        },
        {
          "year": 2011,
          "quarters": [
            { "quarter": 1, "subCountMillion": 4.3 },
            { "quarter": 2, "subCountMillion": 4.4 },
            { "quarter": 3, "subCountMillion": 4.5 },
            { "quarter": 4, "subCountMillion": 5.6 }
          ]
        },
        {
          "year": 2012,
          "quarters": [
            { "quarter": 1, "subCountMillion": 6.8 },
            { "quarter": 2, "subCountMillion": 7.6 },
            { "quarter": 3, "subCountMillion": 8.4 },
            { "quarter": 4, "subCountMillion": 9.7 }
          ]
        },
        {
          "year": 2013,
          "quarters": [
            { "quarter": 4, "subCountMillion": 16.7 }
          ]
        },
        {
          "year": 2014,
          "quarters": [
            { "quarter": 4, "subCountMillion": 33.1 }
          ]
        },
        {
          "year": 2015,
          "quarters": [
            { "quarter": 4, "subCountMillion": 50 }
          ]
        },
        {
          "year": 2016,
          "quarters": [
            { "quarter": 4, "subCountMillion": 71 }
          ]
        },
        {
          "year": 2017,
          "quarters": [
            { "quarter": 4, "subCountMillion": 95 }
          ]
        },
        {
          "year": 2018,
          "quarters": [
            { "quarter": 4, "subCountMillion": 118 }
          ]
        },
        {
          "year": 2019,
          "quarters": [
            { "quarter": 4, "subCountMillion": 140 }
          ]
        },
        {
          "year": 2020,
          "quarters": [
            { "quarter": 4, "subCountMillion": 150 }
          ]
        }
      ]
    },
    {
      "company_name": "DISNEY",
      "years": [
        {
          "year": 2019,
          "quarters": [
            { "quarter": 4, "subCountMillion": 26.5 }
          ]
        },
        {
          "year": 2020,
          "quarters": [
            { "quarter": 1, "subCountMillion": 33.5 },
            { "quarter": 2, "subCountMillion": 57.5 },
            { "quarter": 3, "subCountMillion": 69.0 },
            { "quarter": 4, "subCountMillion": 73.0 }
          ]
        }
      ]
    },
    {
      "company_name": "HBO",
      "years": [
        {
          "year": 2010,
          "quarters": [
            { "quarter": 4, "subCountMillion": 80 }
          ]
        },
        {
          "year": 2011,
          "quarters": [
            { "quarter": 4, "subCountMillion": 90 }
          ]
        },
        {
          "year": 2012,
          "quarters": [
            { "quarter": 4, "subCountMillion": 112 }
          ]
        },
        {
          "year": 2013,
          "quarters": [
            { "quarter": 4, "subCountMillion": 126 }
          ]
        },
        {
          "year": 2014,
          "quarters": [
            { "quarter": 4, "subCountMillion": 137 }
          ]
        },
        {
          "year": 2015,
          "quarters": [
            { "quarter": 4, "subCountMillion": 132 }
          ]
        },
        {
          "year": 2016,
          "quarters": [
            { "quarter": 4, "subCountMillion": 135 }
          ]
        },
        {
          "year": 2017,
          "quarters": [
            { "quarter": 4, "subCountMillion": 140 }
          ]
        }
      ]
    },
    {
      "company_name": "HULU",
      "years": [
        {
          "year": 2010,
          "quarters": [
            { "quarter": 4, "subCountMillion": 0.3 }
          ]
        },
        {
          "year": 2011,
          "quarters": [
            { "quarter": 1, "subCountMillion": 0.5 },
            { "quarter": 2, "subCountMillion": 0.9 },
            { "quarter": 3, "subCountMillion": 1.2 },
            { "quarter": 4, "subCountMillion": 1.5 }
          ]
        },
        {
          "year": 2012,
          "quarters": [
            { "quarter": 1, "subCountMillion": 2.0 },
            { "quarter": 4, "subCountMillion": 3.0 }
          ]
        },
        {
          "year": 2013,
          "quarters": [
            { "quarter": 1, "subCountMillion": 4.0 },
            { "quarter": 4, "subCountMillion": 5.0 }
          ]
        },
        {
          "year": 2014,
          "quarters": [
            { "quarter": 2, "subCountMillion": 6.0 }
          ]
        },
        {
          "year": 2015,
          "quarters": [
            { "quarter": 2, "subCountMillion": 9.0 }
          ]
        },
        {
          "year": 2016,
          "quarters": [
            { "quarter": 2, "subCountMillion": 12.0 }
          ]
        },
        {
          "year": 2017,
          "quarters": [
            { "quarter": 4, "subCountMillion": 17.0 }
          ]
        },
        {
          "year": 2018,
          "quarters": [
            { "quarter": 2, "subCountMillion": 20.0 },
            { "quarter": 4, "subCountMillion": 25.0 }
          ]
        },
        {
          "year": 2019,
          "quarters": [
            { "quarter": 2, "subCountMillion": 26.8 }
          ]
        },
        {
          "year": 2020,
          "quarters": [
            { "quarter": 4, "subCountMillion": 36.0 }
          ]
        }
      ]
    },
    {
      "company_name": "NETFLIX",
      "years": [
        {
          "year": 1999,
          "quarters": [
            { "quarter": 4, "subCountMillion": 0.11 }
          ]
        },
        {
          "year": 2000,
          "quarters": [
            { "quarter": 4, "subCountMillion": 0.18 }
          ]
        },
        {
          "year": 2001,
          "quarters": [
            { "quarter": 4, "subCountMillion": 0.25 }
          ]
        },
        {
          "year": 2002,
          "quarters": [
            { "quarter": 4, "subCountMillion": 0.5 }
          ]
        },
        {
          "year": 2003,
          "quarters": [
            { "quarter": 4, "subCountMillion": 1.15 }
          ]
        },
        {
          "year": 2004,
          "quarters": [
            { "quarter": 4, "subCountMillion": 2.4 }
          ]
        },
        {
          "year": 2005,
          "quarters": [
            { "quarter": 4, "subCountMillion": 3.9 }
          ]
        },
        {
          "year": 2006,
          "quarters": [
            { "quarter": 4, "subCountMillion": 6.2 }
          ]
        },
        {
          "year": 2007,
          "quarters": [
            { "quarter": 4, "subCountMillion": 7.5 }
          ]
        },
        {
          "year": 2008,
          "quarters": [
            { "quarter": 4, "subCountMillion": 9.925 }
          ]
        },
        {
          "year": 2009,
          "quarters": [
            { "quarter": 4, "subCountMillion": 12.0 }
          ]
        },
        {
          "year": 2010,
          "quarters": [
            { "quarter": 4, "subCountMillion": 19.9 }
          ]
        },
        {
          "year": 2011,
          "quarters": [
            { "quarter": 4, "subCountMillion": 23.5 }
          ]
        },
        {
          "year": 2012,
          "quarters": [
            { "quarter": 4, "subCountMillion": 33.1 }
          ]
        },
        {
          "year": 2013,
          "quarters": [
            { "quarter": 4, "subCountMillion": 44.25 }
          ]
        },
        {
          "year": 2014,
          "quarters": [
            { "quarter": 4, "subCountMillion": 57.25 }
          ]
        },
        {
          "year": 2015,
          "quarters": [
            { "quarter": 4, "subCountMillion": 73.5 }
          ]
        },
        {
          "year": 2016,
          "quarters": [
            { "quarter": 4, "subCountMillion": 94.0 }
          ]
        },
        {
          "year": 2017,
          "quarters": [
            { "quarter": 4, "subCountMillion": 103.95 }
          ]
        },
        {
          "year": 2018,
          "quarters": [
            { "quarter": 4, "subCountMillion": 121.6 }
          ]
        },
        {
          "year": 2019,
          "quarters": [
            { "quarter": 4, "subCountMillion": 151.6 }
          ]
        },
        {
          "year": 2020,
          "quarters": [
            { "quarter": 4, "subCountMillion": 183.0 }
          ]
        }
      ]
    },
    {
      "company_name": "SPOTIFY",
      "years": [
        {
          "year": 2015,
          "quarters": [
            { "quarter": 1, "subCountMillion": 18 },
            { "quarter": 2, "subCountMillion": 22 },
            { "quarter": 3, "subCountMillion": 24 },
            { "quarter": 4, "subCountMillion": 28 }
          ]
        },
        {
          "year": 2016,
          "quarters": [
            { "quarter": 1, "subCountMillion": 30 },
            { "quarter": 2, "subCountMillion": 36 },
            { "quarter": 3, "subCountMillion": 40 },
            { "quarter": 4, "subCountMillion": 48 }
          ]
        },
        {
          "year": 2017,
          "quarters": [
            { "quarter": 1, "subCountMillion": 52 },
            { "quarter": 2, "subCountMillion": 59 },
            { "quarter": 3, "subCountMillion": 62 },
            { "quarter": 4, "subCountMillion": 71 }
          ]
        },
        {
          "year": 2018,
          "quarters": [
            { "quarter": 1, "subCountMillion": 75 },
            { "quarter": 2, "subCountMillion": 83 },
            { "quarter": 3, "subCountMillion": 87 },
            { "quarter": 4, "subCountMillion": 96 }
          ]
        },
        {
          "year": 2019,
          "quarters": [
            { "quarter": 1, "subCountMillion": 100 },
            { "quarter": 2, "subCountMillion": 108 },
            { "quarter": 3, "subCountMillion": 113 },
            { "quarter": 4, "subCountMillion": 124 }
          ]
        },
        {
          "year": 2020,
          "quarters": [
            { "quarter": 1, "subCountMillion": 130 },
            { "quarter": 2, "subCountMillion": 138 },
            { "quarter": 3, "subCountMillion": 144 }
          ]
        }
      ]
    }
  ];

  // ===========================
  // SHARED STATE & UTILITIES
  // ===========================
  
  // Make data and utilities globally accessible
  window.mediaData = {
    rawData: rawData,
    selectedStreams: new Set(),
    currentChartType: 'line' // default chart type
  };

  // Shared utility functions
  window.mediaUtils = {
    streamToCompany: function(stream) {
      switch (stream) {
        case "HBO": return "HBO";
        case "HULU": return "HULU";
        case "AMAZON": return "AMAZON";
        case "DISNEY": return "DISNEY";
        case "NETFLIX": return "NETFLIX";
        case "SPOTIFY": return "SPOTIFY";
        default: return null;
      }
    },

    companyColors: {
      "HBO": "#8B5CF6",
      "HULU": "#10B981",
      "AMAZON": "#FF9900",
      "DISNEY": "#3B82F6",
      "NETFLIX": "#E50914",
      "SPOTIFY": "#1DB954"
    },

    extractSeries: function(companyName) {
      const company = rawData.find(c => c.company_name === companyName);
      if (!company) return { labels: [], values: [] };

      const labels = [];
      const values = [];
      
      company.years.forEach(yearObj => {
        yearObj.quarters.forEach(q => {
          labels.push(`${yearObj.year} Q${q.quarter}`);
          values.push(q.subCountMillion);
        });
      });

      return { labels, values };
    }
  };


  const draggableButtons = document.querySelectorAll(".comparison-link");
  const dropZone = document.getElementById("dropZone");
  const searchMediaBox = document.getElementById("searchMediaBox");
  const resultsBox = document.getElementById("searchResults");

  // Safety checks
  if (!dropZone) {
    console.error('No element found with id="dropZone".');
    return;
  }

  if (!searchMediaBox) {
    console.error('No SearchMediaBox present');
  }

  // Search functionality
  function searchMedia() {
    const input = searchMediaBox.value.trim().toLowerCase();
    resultsBox.innerHTML = "";

    if (input === "") {
      return;
    }

    draggableButtons.forEach((button) => {
      const value = button.dataset.stream.toLowerCase();
      if (value.includes(input)) {
        outputValue(value);
      }
    });
  }

  function outputValue(value) {
    const item = document.createElement("button");
    item.className = "search-result-item";
    item.textContent = value.toUpperCase();
    resultsBox.appendChild(item);

    item.addEventListener("click", () => {
      const stream = value.toUpperCase();

      if (window.mediaData.selectedStreams.has(stream)) {
        window.mediaData.selectedStreams.delete(stream);
        item.classList.remove("active");
      } else {
        window.mediaData.selectedStreams.add(stream);
        item.classList.add("active");
      }
      updateButtonStates();
      console.clear();
      console.log("Selected streams:", [...window.mediaData.selectedStreams]);
    });
  }

  // Button click and drag functionality
  draggableButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleButtonActive(button.dataset.stream);
      logSelectedIntValues();
    });

    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.id);
      event.dataTransfer.effectAllowed = "move";
      
      // Set custom drag image to show the logo instead of text
     
    });
  });

  // Drop zone functionality
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const draggedEl = document.getElementById(id);
    if (!draggedEl) return;

    const stream = draggedEl.dataset.stream;
    toggleButtonActive(stream);
    logSelectedIntValues();
  });

  function toggleButtonActive(stream) {
    if (window.mediaData.selectedStreams.has(stream)) {
      window.mediaData.selectedStreams.delete(stream);
    } else {
      window.mediaData.selectedStreams.add(stream);
    }
    updateButtonStates();
  }

  function updateButtonStates() {
    document.querySelectorAll(".comparison-link").forEach((btn) => {
      btn.classList.toggle("active", window.mediaData.selectedStreams.has(btn.dataset.stream));
    });
    
    // Update empty state visibility
    updateEmptyStateVisibility();
    
    // Update the active chart
    updateActiveChart();
  }

  // Function to show/hide empty state based on active buttons
  function updateEmptyStateVisibility() {
    const emptyState = document.getElementById('emptyState');
    const comparisonArea = document.getElementById('dropZone');
    
    if (window.mediaData.selectedStreams.size > 0) {
      // Hide empty state when at least one button is active
      emptyState.style.display = 'none';
      comparisonArea.classList.add('has-data');
    } else {
      // Show empty state when no buttons are active
      emptyState.style.display = 'flex';
      comparisonArea.classList.remove('has-data');
    }
  }

  function streamToInt(stream) {
    switch (stream) {
      case "HBO": return 1;
      case "HULU": return 2;
      case "AMZN": return 3;
      case "DISNY": return 4;
      case "NTFLX": return 5;
      case "SPTFY": return 6;
      default: return 0;
    }
  }

  function logSelectedIntValues() {
    console.clear();
    console.log("Selected streams:", [...window.mediaData.selectedStreams]);
    window.mediaData.selectedStreams.forEach((stream) => {
      console.log(stream, "=>", streamToInt(stream));
    });
  }

  // ===========================
  // CHART TYPE SWITCHING
  // ===========================

  function updateActiveChart() {
    switch(window.mediaData.currentChartType) {
      case 'line':
        if (typeof updateLineChart === 'function') {
          updateLineChart();
        }
        break;
      case 'bubble':
        if (typeof updateBubbleChart === 'function') {
          updateBubbleChart();
        }
        break;
      case 'bar':
        if (typeof updateBarChart === 'function') {
          updateBarChart();
        }
        break;
      case 'pie':
        if (typeof updatePieChart === 'function') {
          updatePieChart();
        }
        break;
      case 'scatter':
        if (typeof updateScatterChart === 'function') {
          updateScatterChart();
        }
        break;
        case 'racing':
         if (typeof updateRacingChart === 'function') {
         updateRacingChart();
        }
        
  break;
  case 'area':
  if (typeof updateAreaChart === 'function') {
    updateAreaChart();
  }
  break;
case 'heatmap':
  if (typeof updateHeatmap === 'function') {
    updateHeatmap();
  }
  break;
      case 'area':
        if (typeof updateAreaChart === 'function') {
          updateAreaChart();
        }
        break;
        case 'area':
  if (typeof updateStackedAreaChart === 'function') {
    updateStackedAreaChart();
  }
  break;
    }
  }

  // Chart type button listeners (assuming you have buttons for chart types)
  document.querySelectorAll('[data-chart-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.mediaData.currentChartType = btn.dataset.chartType;
      
      // Update active button styling
      document.querySelectorAll('[data-chart-type]').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      
      // Show/hide appropriate chart containers
      document.querySelectorAll('[data-chart-container]').forEach(container => {
        container.style.display = 'none';
      });
      const activeContainer = document.querySelector(`[data-chart-container="${window.mediaData.currentChartType}"]`);
      if (activeContainer) {
        activeContainer.style.display = 'block';
      }
      
      updateActiveChart();
    });
  });

  // Make search function globally accessible
  window.searchMedia = searchMedia;

  // Initial chart render
  updateActiveChart();
  
  // Initial empty state check
  updateEmptyStateVisibility();
});