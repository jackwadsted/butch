# BUTCH: Brilliant Unix Timestamp Conversion Helper

A Chrome extension for converting Unix timestamps to human-readable dates. Highlights on pages, a popup, and a DevTools panel.

## Installation

This extension is not published to the Chrome Web Store. Load it as an unpacked extension:

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder

## Features

### Context menu
Highlight any Unix timestamp on a page, right-click, and select the menu item to copy the converted date to your clipboard. The menu title updates to show the converted value before you click.

### Popup
Click the extension icon in the toolbar to open the popup. If you have a valid timestamp selected on the current page it will appear pre-converted at the top. There is also a manual input field for typing or pasting a timestamp directly.

### DevTools panel
Open Chrome DevTools and find the **BUTCH** panel tab. This gives you a persistent timestamp converter while you work — useful when inspecting API responses or log output.

## Notes

### Seconds and milliseconds
The converter automatically detects the unit: values greater than `1e12` are treated as milliseconds, everything else as seconds.

### Valid range
Timestamps are validated to produce dates between 1970 and 2100. Anything outside that range (or non-numeric input) is rejected.

### DevTools panel and `window`
The DevTools panel runs in a privileged devtools page context, not in the content of the inspected tab. `chrome.scripting` and similar APIs are not available there. The panel communicates with the inspected page's JavaScript environment via `chrome.devtools.inspectedWindow.eval`, which executes in the `window` context of the page under inspection. Keep this in mind if you extend the panel — references like `window.myVar` refer to the inspected page's global scope, not the panel's own.

### Chrome vs Firefox
Chrome does not support `contextMenus.onShown`. To work around this, `content.js` listens for `mousedown` with button 2 (right-click) and sends the current selection to the service worker immediately, so the menu title is up to date by the time the context menu renders. Firefox supports `onShown` natively; that branch is present in `background.js` but never reached in Chrome.
