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

function flashCopied(btn) {
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = orig;
    btn.classList.remove('copied');
  }, 1500);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Auto-populate from active tab's selection
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim()
      });
      const selected = results?.[0]?.result;
      if (selected) {
        const converted = convertUnixTime(selected);
        if (converted) {
          document.getElementById('selection-section').classList.remove('hidden');
          document.getElementById('selected-value').textContent = selected;
          document.getElementById('converted-selection').textContent = converted;
          document.getElementById('copy-selection').addEventListener('click', () => {
            navigator.clipboard.writeText(converted);
            flashCopied(document.getElementById('copy-selection'));
          });
        }
      }
    }
  } catch (_) {
    // scripting unavailable on chrome:// pages — silently skip
  }

  // Manual input with live conversion
  const input = document.getElementById('manual-input');
  const output = document.getElementById('converted-manual');
  const copyBtn = document.getElementById('copy-manual');
  let currentConverted = null;

  input.addEventListener('input', () => {
    const converted = convertUnixTime(input.value);
    currentConverted = converted;
    if (converted) {
      output.textContent = converted;
      output.classList.remove('error');
      copyBtn.classList.remove('hidden');
    } else if (input.value.trim()) {
      output.textContent = 'Not a valid Unix timestamp';
      output.classList.add('error');
      copyBtn.classList.add('hidden');
    } else {
      output.textContent = '';
      copyBtn.classList.add('hidden');
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!currentConverted) return;
    navigator.clipboard.writeText(currentConverted);
    flashCopied(copyBtn);
  });
});
