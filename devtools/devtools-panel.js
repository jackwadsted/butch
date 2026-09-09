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

const input = document.getElementById('ts-input');
const result = document.getElementById('result');
const copyBtn = document.getElementById('copy-btn');
let currentConverted = null;

input.addEventListener('input', () => {
  const converted = convertUnixTime(input.value);
  currentConverted = converted;
  if (converted) {
    result.textContent = converted;
    result.classList.remove('error');
    copyBtn.classList.remove('hidden');
  } else if (input.value.trim()) {
    result.textContent = 'Not a valid Unix timestamp';
    result.classList.add('error');
    copyBtn.classList.add('hidden');
  } else {
    result.textContent = '';
    copyBtn.classList.add('hidden');
  }
});

copyBtn.addEventListener('click', () => {
  if (!currentConverted) return;
  navigator.clipboard.writeText(currentConverted).then(() => {
    const orig = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = orig;
      copyBtn.classList.remove('copied');
    }, 1500);
  });
});
