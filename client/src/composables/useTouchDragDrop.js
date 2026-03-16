/**
 * Touch-friendly drag and drop for mobile browsers.
 *
 * - Long-press (~200 ms) initiates drag with haptic feedback.
 * - A ghost clone follows the finger.
 * - Drop zones are identified by the `data-drop-status` attribute.
 * - Auto-scrolls containers marked with `data-drag-scroll`.
 * - Works alongside native HTML5 DnD (which handles desktop).
 */
import { reactive, readonly, onMounted, onUnmounted } from 'vue';

const LONG_PRESS_MS = 200;
const MOVE_THRESHOLD = 8;
const AUTO_SCROLL_THRESHOLD = 50;
const AUTO_SCROLL_SPEED = 6;

/* ------------------------------------------------------------------ */
/*  Module-level singleton state                                       */
/* ------------------------------------------------------------------ */
const state = reactive({
  dragging: false,
  taskId: null,
  hoverStatus: null,
});

export const touchDragState = readonly(state);

let ghost = null;
let sourceEl = null;
let timer = null;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;
let scrollInterval = null;

/* ------------------------------------------------------------------ */
/*  Drop callbacks                                                     */
/* ------------------------------------------------------------------ */
const dropCallbacks = new Set();

function notifyDrop(taskId, status) {
  for (const cb of dropCallbacks) cb({ id: taskId, status });
}

/* ------------------------------------------------------------------ */
/*  Ghost element                                                      */
/* ------------------------------------------------------------------ */
function createGhost(el, x, y) {
  const rect = el.getBoundingClientRect();
  offsetX = x - rect.left;
  offsetY = y - rect.top;

  ghost = el.cloneNode(true);
  // Remove any id to avoid duplicates
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    zIndex: '10000',
    pointerEvents: 'none',
    width: rect.width + 'px',
    height: rect.height + 'px',
    opacity: '0.92',
    transform: 'rotate(1.5deg) scale(1.03)',
    boxShadow: '0 16px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
    borderRadius: getComputedStyle(el).borderRadius,
    left: x - offsetX + 'px',
    top: y - offsetY + 'px',
    cursor: 'grabbing',
    willChange: 'transform',
    transition: 'none',
  });
  document.body.appendChild(ghost);
}

function moveGhost(x, y) {
  if (!ghost) return;
  ghost.style.left = x - offsetX + 'px';
  ghost.style.top = y - offsetY + 'px';
}

/* ------------------------------------------------------------------ */
/*  Drop-zone detection via elementsFromPoint                          */
/* ------------------------------------------------------------------ */
function findDropStatus(x, y) {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    if (el === ghost) continue;
    const status = el.dataset?.dropStatus;
    if (status) return status;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Auto-scroll near edges of [data-drag-scroll] containers           */
/* ------------------------------------------------------------------ */
function startAutoScroll(x, y) {
  stopAutoScroll();
  scrollInterval = setInterval(() => {
    const containers = document.querySelectorAll('[data-drag-scroll]');
    containers.forEach((container) => {
      const rect = container.getBoundingClientRect();
      const inX = x >= rect.left && x <= rect.right;
      const inY = y >= rect.top && y <= rect.bottom;
      if (!inX || !inY) return;

      if (x - rect.left < AUTO_SCROLL_THRESHOLD)
        container.scrollLeft -= AUTO_SCROLL_SPEED;
      if (rect.right - x < AUTO_SCROLL_THRESHOLD)
        container.scrollLeft += AUTO_SCROLL_SPEED;
      if (y - rect.top < AUTO_SCROLL_THRESHOLD)
        container.scrollTop -= AUTO_SCROLL_SPEED;
      if (rect.bottom - y < AUTO_SCROLL_THRESHOLD)
        container.scrollTop += AUTO_SCROLL_SPEED;
    });
  }, 16);
}

function stopAutoScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

/* ------------------------------------------------------------------ */
/*  Prevent accidental click after drag                                */
/* ------------------------------------------------------------------ */
function preventNextClick() {
  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('click', handler, true);
  };
  document.addEventListener('click', handler, true);
  // Safety removal in case the click never fires
  setTimeout(() => document.removeEventListener('click', handler, true), 400);
}

/* ------------------------------------------------------------------ */
/*  Core touch handlers (document-level once drag is primed)           */
/* ------------------------------------------------------------------ */
function onTouchMove(e) {
  const touch = e.touches[0];

  if (!state.dragging) {
    // If finger moved too far before long-press fired, cancel
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      cleanup();
    }
    return;
  }

  e.preventDefault(); // Prevent scrolling while dragging
  moveGhost(touch.clientX, touch.clientY);
  state.hoverStatus = findDropStatus(touch.clientX, touch.clientY);
  startAutoScroll(touch.clientX, touch.clientY);
}

function onTouchEnd() {
  const hadDrag = state.dragging;
  const taskId = state.taskId;
  const status = state.hoverStatus;
  cleanup();

  if (hadDrag) {
    preventNextClick();
    if (taskId && status) notifyDrop(taskId, status);
  }
}

function cleanup() {
  clearTimeout(timer);
  stopAutoScroll();
  if (ghost) {
    ghost.remove();
    ghost = null;
  }
  if (sourceEl) {
    sourceEl.style.opacity = '';
    sourceEl.style.transform = '';
    sourceEl = null;
  }
  state.dragging = false;
  state.taskId = null;
  state.hoverStatus = null;
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  document.removeEventListener('touchcancel', onTouchEnd);
}

/* ------------------------------------------------------------------ */
/*  Public: call on touchstart of a draggable element                  */
/* ------------------------------------------------------------------ */
export function startTouchDrag(e, taskId) {
  if (state.dragging) return;

  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  sourceEl = e.currentTarget;
  state.taskId = taskId;

  // Prevent context menu on long press
  const preventCtx = (ev) => ev.preventDefault();
  sourceEl.addEventListener('contextmenu', preventCtx, { once: true });

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
  document.addEventListener('touchcancel', onTouchEnd);

  timer = setTimeout(() => {
    state.dragging = true;
    sourceEl.style.opacity = '0.35';
    sourceEl.style.transform = 'scale(0.97)';
    createGhost(sourceEl, startX, startY);
    if (navigator.vibrate) navigator.vibrate(25);
  }, LONG_PRESS_MS);
}

/* ------------------------------------------------------------------ */
/*  Composable: register a component's drop callback                   */
/* ------------------------------------------------------------------ */
export function useTouchDropHandler(onStatusChange) {
  const handler = (payload) => onStatusChange(payload);
  onMounted(() => dropCallbacks.add(handler));
  onUnmounted(() => dropCallbacks.delete(handler));
}
