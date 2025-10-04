// sketch.js - Lado cliente p5.js
// Gestiona dibujo local y sincronización periódica con el backend

const API_BASE = '/api';
let userColor = '#000000';
let points = []; // cache local de acciones
let isDrawing = false;
let lastSent = 0;
const SEND_THROTTLE_MS = 25; // limitar frecuencia de envíos

function setup() {
  const canvas = createCanvas(800, 500);
  canvas.parent('canvasWrapper');
  background(255);
  fetchRandomColor();
  setInterval(refreshBoard, 1000); // polling cada 1s
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', clearBoard);
}

function mousePressed() {
  isDrawing = true;
}
function mouseReleased() {
  isDrawing = false;
}
function touchStarted() { isDrawing = true; }
function touchEnded() { isDrawing = false; }

function draw() {
  if (isDrawing) {
    const now = performance.now();
    if (now - lastSent >= SEND_THROTTLE_MS) {
      const action = { x: mouseX, y: mouseY, color: userColor, clear: false };
      sendAction(action);
      lastSent = now;
      // Dibujo optimista local inmediato
      drawPoint(action);
      points.push(action);
    }
  }
}

function drawPoint(a) {
  noStroke();
  fill(a.color || '#000');
  ellipse(a.x, a.y, 10, 10);
}

function renderBoard(list) {
  background(255);
  list.forEach(drawPoint);
}

async function refreshBoard() {
  try {
    const res = await fetch(API_BASE + '/board');
    if (!res.ok) return;
    const data = await res.json();
    points = data;
    renderBoard(points);
  } catch (e) {
    console.warn('Error obteniendo board', e);
  }
}

async function sendAction(action) {
  try {
    await fetch(API_BASE + '/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
  } catch (e) {
    console.warn('Error enviando acción', e);
  }
}

async function clearBoard() {
  try {
    await fetch(API_BASE + '/clear', { method: 'POST' });
    // La próxima actualización de polling limpiará; reseteo visual rápido:
    points = [];
    background(255);
  } catch (e) {
    console.warn('Error limpiando', e);
  }
}

async function fetchRandomColor() {
  try {
    const res = await fetch(API_BASE + '/randomColor');
    if (res.ok) {
      const { color } = await res.json();
      userColor = color;
    } else {
      userColor = randomColorFallback();
    }
  } catch (e) {
    userColor = randomColorFallback();
  }
  document.getElementById('userColor').style.background = userColor;
}

function randomColorFallback() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}
