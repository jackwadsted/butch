const MENU_ID = 'unix-convert';
let lastConverted = null;

function convertUnixTime(raw) {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const n = parseInt(text, 10);
  const ms = n > 1e12 ? n : n * 1000;
  const date = new Date(ms);
  const year = date.getFullYear();
  if (isNaN(date.getTime()) || year < 1970 || year > 2100) return null;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function updateMenu(selectionText) {
  const converted = selectionText ? convertUnixTime(selectionText) : null;
  lastConverted = converted;
  chrome.contextMenus.update(MENU_ID, {
    title: converted ? `Copy: ${converted}` : 'Valid Unix time not selected...'
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Valid Unix time not selected...',
      contexts: ['selection'],
      visible: true
    });
  });
});

// Chrome doesn't support onShown, so content.js sends the selection on mousedown
// (which fires before the context menu renders), giving us time to update the title.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'selection') updateMenu(msg.text);
});

// Accepting the port is what keeps the service worker alive as long as the tab is open.
chrome.runtime.onConnect.addListener((_port) => {});

// onShown is Firefox-only; on Chrome this branch is never entered.
chrome.contextMenus.onShown?.addListener((info) => {
  updateMenu(info.selectionText);
  chrome.contextMenus.refresh();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const converted = lastConverted ?? convertUnixTime(info.selectionText ?? '');
  if (!converted) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      navigator.clipboard.writeText(text).catch(() => {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        Object.assign(ta.style, { position: 'fixed', opacity: '0' });
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      });
    },
    args: [converted]
  });
});
