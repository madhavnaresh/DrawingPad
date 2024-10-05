// Selecting DOM elements
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const saveBtn = document.getElementById('saveBtn');
const drawBtn = document.getElementById('drawBtn');
const rectBtn = document.getElementById('rectBtn');
const circleBtn = document.getElementById('circleBtn');
const textBtn = document.getElementById('textBtn');
const eraserBtn = document.getElementById('eraserBtn');
const eraserSize = document.getElementById('eraserSize');
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const newSlideBtn = document.getElementById('newSlideBtn');
const colorPicker = document.getElementById('colorPicker');
const textInput = document.getElementById('textInput');

// Initial setup
let drawing = false;
let mode = 'draw'; // Modes: draw, rect, circle, text, erase
let startX, startY;
let currentX, currentY;
let history = [];
let historyStep = -1;

// Slides management
let slides = [];
let currentSlideIndex = 0;

// Set up canvas context
ctx.lineWidth = 2;
ctx.lineCap = 'round';
ctx.strokeStyle = colorPicker.value;
ctx.fillStyle = colorPicker.value;
ctx.font = '20px Arial';

// Save the current state to history
function saveHistory() {
  if (historyStep < history.length - 1) {
    history = history.slice(0, historyStep + 1);
  }
  history.push(canvas.toDataURL());
  historyStep++;
  updateUndoRedoButtons();
}

// Update the state of undo and redo buttons
function updateUndoRedoButtons() {
  undoBtn.disabled = historyStep <= 0;
  redoBtn.disabled = historyStep >= history.length - 1;
}

// Undo functionality
function undo() {
  if (historyStep > 0) {
    historyStep--;
    let img = new Image();
    img.src = history[historyStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    updateUndoRedoButtons();
  }
}

// Redo functionality
function redo() {
  if (historyStep < history.length - 1) {
    historyStep++;
    let img = new Image();
    img.src = history[historyStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    updateUndoRedoButtons();
  }
}

// Save all slides as one PDF
function saveSlidesAsPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  slides.forEach((slide, index) => {
    if (index > 0) pdf.addPage();
    pdf.addImage(slide, 'PNG', 0, 0, 210, 297); // Adjust dimensions for A4 size
  });
  pdf.save('slides.pdf');
}

// Update the canvas based on the current slide
function updateCanvas() {
  const img = new Image();
  img.src = slides[currentSlideIndex];
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// Create a new slide
function createSlide() {
  if (canvas.toDataURL()) {
    slides[currentSlideIndex] = canvas.toDataURL();
  }
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvas.width;
  newCanvas.height = canvas.height;
  const newCtx = newCanvas.getContext('2d');
  slides.push(newCanvas.toDataURL()); // Store the new blank slide
  currentSlideIndex = slides.length - 1;
  updateCanvas();
  saveHistory();
}

// Initialize the first slide
function initializeFirstSlide() {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvas.width;
  newCanvas.height = canvas.height;
  slides.push(newCanvas.toDataURL()); // Store a blank slide
}

// Event listeners for buttons
drawBtn.addEventListener('click', () => {
  mode = 'draw';
  ctx.strokeStyle = colorPicker.value;
});

rectBtn.addEventListener('click', () => {
  mode = 'rect';
});

circleBtn.addEventListener('click', () => {
  mode = 'circle';
});

textBtn.addEventListener('click', () => {
  mode = 'text';
});

eraserBtn.addEventListener('click', () => {
  mode = 'erase';
  ctx.strokeStyle = '#ffffff'; // Use white for erasing
});

// Change color based on color picker
colorPicker.addEventListener('change', () => {
  ctx.strokeStyle = colorPicker.value;
});

// Handle text input and drawing
textInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter' && mode === 'text') {
    ctx.fillText(textInput.value, startX, startY);
    saveHistory();
    textInput.value = ''; // Clear input after placing text
  }
});

// Handle mouse events on the canvas
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  drawing = true;

  if (mode === 'draw') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  currentX = e.clientX - rect.left;
  currentY = e.clientY - rect.top;

  if (mode === 'draw') {
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  } else if (mode === 'rect') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCanvas(); // Redraw the current slide
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
  } else if (mode === 'circle') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCanvas(); // Redraw the current slide
    const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
    ctx.beginPath();
    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (mode === 'erase') {
    ctx.clearRect(currentX - parseInt(eraserSize.value), currentY - parseInt(eraserSize.value), parseInt(eraserSize.value) * 2, parseInt(eraserSize.value) * 2);
  }
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
  if (mode === 'draw' || mode === 'rect' || mode === 'circle' || mode === 'erase') {
    saveHistory();
  }
});

// Button event listeners
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
saveBtn.addEventListener('click', saveSlidesAsPDF);
newSlideBtn.addEventListener('click', createSlide);
prevSlideBtn.addEventListener('click', () => {
  if (currentSlideIndex > 0) {
    // Save current slide state
    slides[currentSlideIndex] = canvas.toDataURL();
    currentSlideIndex--;
    updateCanvas();
  }
});
nextSlideBtn.addEventListener('click', () => {
  if (currentSlideIndex < slides.length - 1) {
    // Save current slide state
    slides[currentSlideIndex] = canvas.toDataURL();
    currentSlideIndex++;
    updateCanvas();
  }
});

// Initialize the first slide
initializeFirstSlide();
