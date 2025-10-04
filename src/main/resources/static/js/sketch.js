// sketch.js - Lado cliente p5.js
// Gestiona dibujo local y sincronización periódica con el backend

const API_BASE = '/api';
let userColor = '#000000';
let points = []; // cache local de acciones
let isDrawing = false;
let lastSent = 0;
const SEND_THROTTLE_MS = 20; // limitar frecuencia de envíos

// WebSocket / STOMP
let stompClient = null;
let connected = false;
let manualReloadBtn;
let pollingIntervalId = null; // fallback
const FALLBACK_POLL_RATE = 5000; // si ws desconecta mantenemos algo de actualización

function setup() {
  const canvas = createCanvas(adjustedWidth(), adjustedHeight());
  canvas.parent('canvasWrapper');
  background(255);
  fetchRandomColor();
  manualReloadBtn = document.getElementById('reloadBtn');
  manualReloadBtn.addEventListener('click', () => refreshBoard());
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', clearBoardRealtime);
  window.addEventListener('resize', resizeBoard);
  initWebSocket();
  // Polling inicial rápido para primer render antes de que el WS envíe eventos
  refreshBoard();
}

function adjustedWidth(){
  return Math.min(1000, window.innerWidth - 80);
}
function adjustedHeight(){
  return Math.min(600, Math.round(window.innerHeight * 0.55));
}
function resizeBoard(){
  const prev = points.slice();
  resizeCanvas(adjustedWidth(), adjustedHeight());
  background(255);
  renderBoard(prev);
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
  if (connected && stompClient) {
    stompClient.send('/app/draw', {}, JSON.stringify(action));
  } else {
    // fallback http si no hay ws
    try {
      await fetch(API_BASE + '/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
    } catch (e) { console.warn('Error enviando acción fallback', e); }
  }
}

function clearBoardRealtime(){
  if (connected && stompClient){
    stompClient.send('/app/clear', {}, '{}');
  } else {
    clearBoardFallback();
  }
}

async function clearBoardFallback(){
  try { await fetch(API_BASE + '/clear', { method: 'POST' }); } catch(e){ console.warn(e); }
  points = []; background(255);
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

// ------------------------- WebSocket / STOMP -------------------------
function initWebSocket(){
  updateStatus('connectando');
  const sock = new SockJS('/ws');
  stompClient = Stomp.over(sock);
  stompClient.debug = () => {}; // silenciar
  stompClient.connect({},() => {
    connected = true;
    updateStatus('online');
    if (pollingIntervalId){ clearInterval(pollingIntervalId); pollingIntervalId=null; }
    stompClient.subscribe('/topic/board', msg => {
      try {
        const action = JSON.parse(msg.body);
        if (action.clear){
          points = []; background(255); return;
        }
        points.push(action);
        drawPoint(action);
      } catch(e){ console.warn('Error parse acción', e); }
    });
    stompClient.subscribe('/topic/clear', () => {
      points = []; background(255);
    });
  }, err => {
    console.warn('WS error', err);
    connected = false; updateStatus('offline');
    if (!pollingIntervalId){
      pollingIntervalId = setInterval(refreshBoard, FALLBACK_POLL_RATE);
    }
    // reintent gradual
    setTimeout(initWebSocket, 3000);
  });
}

function updateStatus(state){
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if(!dot||!txt) return;
  dot.classList.remove('offline','connecting','online');
  switch(state){
    case 'online':
      dot.classList.add('online'); txt.textContent='Conectado'; dot.title='Conectado'; break;
    case 'connectando':
    case 'connecting':
      dot.classList.add('connecting'); txt.textContent='Conectando…'; dot.title='Conectando'; break;
    default:
      dot.classList.add('offline'); txt.textContent='Desconectado'; dot.title='Desconectado';
  }
}
