// A persistent port keeps the MV3 service worker alive so updates are instant.
function connectKeepAlive() {
  try {
    const port = chrome.runtime.connect({ name: 'keepalive' });
    port.onDisconnect.addListener(connectKeepAlive);
  } catch {}
}
connectKeepAlive();

// Update the menu title on selectionchange — fires when the user finishes
// highlighting, well before they right-click, so contextMenus.update() has
// time to complete before the menu renders.
let lastSent = '';
function sendSelection() {
  const text = window.getSelection()?.toString() ?? '';
  if (text === lastSent) return;
  lastSent = text;
  try { chrome.runtime.sendMessage({ type: 'selection', text }).catch(() => {}); } catch {}
}

document.addEventListener('selectionchange', sendSelection);
// Fallback: also send on right-click in case selectionchange didn't fire
// (e.g. the selection was set programmatically).
document.addEventListener('mousedown', (e) => {
  if (e.button !== 2) return;
  sendSelection();
}, { capture: true, passive: true });
