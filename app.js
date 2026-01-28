document.addEventListener("DOMContentLoaded", () => {


  // Get all buttons with the class 'comparison-link'
  const draggableButtons = document.querySelectorAll(".comparison-link");

  // Get the drop zone element
  const dropZone = document.getElementById("dropZone");

  // Track multiple selected streams (no duplicates)
  const selectedStreams = new Set();

 const searchMediaBox = document.getElementById("searchMediaBox")

  const resultsBox = document.getElementById("searchResults");
  
  // Safety check
  if (!dropZone) {
    console.error('No element found with id="dropZone".');
    return;
  }

  if(!searchMediaBox){
    console.error('No SearchMediaBoxPresent')
  }

  function searchMedia(){
    console.log("searching..")
    let input = searchMediaBox.value.toLowerCase();
    console.log("searching for "+input)

     draggableButtons.forEach((button) => {
    
    const value = button.dataset.stream.toLowerCase();
     // console.log("here are all the button values:"+value)
       if (value.includes(input)||(value.startsWith(input))){

        console.log('possible outcomes:'+value)
        outputValue(value);
       }
      else {
        console.log('no media available for the search clearing the searchbar '+ input)

      }
      
    });
  }
  function outputValue(value){
    

   const resultsBox = document.getElementById("searchResults");

  const item = document.createElement("div");
  item.textContent = value.toUpperCase();

  resultsBox.appendChild(item);   
    
      
  }
    



  draggableButtons.forEach((button) => {
    // CLICK should toggle selection (multi-select)
    button.addEventListener("click", () => {
      toggleButtonActive(button.dataset.stream);
      logSelectedIntValues();
    });

    // DRAGSTART: put the element id into the drag payload
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.id);
      event.dataTransfer.effectAllowed = "move";
    });
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();

    const id = event.dataTransfer.getData("text/plain");
    const draggedEl = document.getElementById(id);

    if (!draggedEl) return;

    const stream = draggedEl.dataset.stream;

    // Alert only when dropped into the zone
   // alert(`"${stream}" was dropped into the comparison area`);

    // Toggle selection (multi-select)
    toggleButtonActive(stream);
    logSelectedIntValues();
  });

  function toggleButtonActive(stream) {
    if (selectedStreams.has(stream)) {
      selectedStreams.delete(stream);
    } else {
      selectedStreams.add(stream);
    }

    updateButtonStates();
  }

  function updateButtonStates() {
    document.querySelectorAll(".comparison-link").forEach((btn) => {
      btn.classList.toggle("active", selectedStreams.has(btn.dataset.stream));

      
    });
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
    console.log("Selected streams:", [...selectedStreams]);

    selectedStreams.forEach((stream) => {
      console.log(stream, "=>", streamToInt(stream));
    });
  }

  window.searchMedia = searchMedia;
});
