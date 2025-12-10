<p align="center">

  <!-- Version -->
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" />

  <!-- License -->
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />

  <!-- Chrome Extension -->
  <img src="https://img.shields.io/badge/Chrome%20Extension-MV3-orange?style=for-the-badge&logo=google-chrome" />

  <!-- OS Used -->
  <img src="https://img.shields.io/badge/Developed%20On-Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" />

  <!-- Technologies -->
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-orange?style=for-the-badge&logo=html5" />
  <img src="https://img.shields.io/badge/CSS3-blue?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Chrome%20API-Extensions-red?style=for-the-badge&logo=google-chrome&logoColor=white" />

  <!-- Repo Stats -->
  <a href="https://github.com/vinothkumar2/Focus-Tab/stargazers">
    <img src="https://img.shields.io/github/stars/vinothkumar2/Focus-Tab?style=for-the-badge" />
  </a>
  <a href="https://github.com/vinothkumar2/Focus-Tab/forks">
    <img src="https://img.shields.io/github/forks/vinothkumar2/Focus-Tab?style=for-the-badge" />
  </a>
  <a href="https://github.com/vinothkumar2/Focus-Tab/issues">
    <img src="https://img.shields.io/github/issues/vinothkumar2/Focus-Tab?style=for-the-badge" />
  </a>

  <!-- Fun Badge -->
  <img src="https://img.shields.io/badge/Stay%20Focused-🚀-brightgreen?style=for-the-badge" />

</p>

# Focus-Tab

A Chrome extension that hides blacklisted sites during a focus session and displays a motivational warning page when a blocked site is accessed.

[Quick Links: [Introduction](#introduction) · [Tech Stack](#tech-stack) · [Prerequisites / Requirements](#prerequisites--requirements) · [Installation](#installation) · [Configuration](#configuration) · [Usage](#usage) · [Project Structure](#project-structure) · [Features](#features) · [Development](#development) · [Contributing](#contributing) · [License](#license) · [FAQ](#faq)]

## Introduction

Focus-Tab helps you stay productive by automatically hiding tabs that match a user‑defined blacklist while a focus session is active. When a blocked site is opened, the extension redirects the tab to a motivational warning page.

## Tech Stack

- **JavaScript** – core logic and Chrome extension APIs  
- **HTML** – popup UI and warning page  
- **CSS** – styling for popup and warning page  
- **Chrome Manifest V3** – extension manifest  

## Prerequisites / Requirements

- Google Chrome (or any Chromium‑based browser supporting Manifest V3)  
- Basic knowledge of Chrome extensions (optional for developers)  
- Node.js (optional, only if you plan to run the development build scripts)  

## Installation

1. Clone the repository  

   ```bash
   git clone https://github.com/vinothkumar2/Focus-Tab.git
   cd Focus-Tab
   ```

2. Open Chrome and navigate to `chrome://extensions/`.

3. Enable **Developer mode** (toggle in the top‑right corner).

4. Click **Load unpacked** and select the repository’s root folder.

The extension should now appear in your toolbar.

## Configuration

- Open the extension popup by clicking the icon.  
- Use the **Add to Blacklist** input to enter domains (e.g., `youtube.com`).  
- Press **Add to Blacklist**; the site appears in the list with a remove button.  
- The blacklist is stored locally via `chrome.storage.local`.

## Usage

- Click **Start Focus Session** to hide all tabs whose URLs match any entry in the blacklist.  
- While the session is active, attempts to navigate to a blocked site are redirected to `warning.html`, which shows a motivational message.  
- Click **End Focus Session** to restore the hidden tabs.

## Project Structure

```
Focus-Tab/
├─ background.js          # Core logic for hiding/restoring tabs
├─ manifest.json          # Extension manifest (V3)
├─ icons/
│  └─ icon48.png          # Toolbar icon
├─ popup/
│  ├─ popup.html          # Popup UI markup
│  ├─ popup.css           # Popup styling
│  └─ popup.js            # Popup interaction script
├─ warning.html           # Motivational warning page
└─ README.md              # This file
```

## Features

- **Blacklist management** – add or remove sites directly from the popup.  
- **One‑click focus mode** – hide all matching tabs instantly.  
- **Automatic restoration** – restore hidden tabs when the session ends.  
- **Motivational warning page** – friendly reminder when a blocked site is accessed.  

## Development

If you wish to modify or extend the extension:

1. Install dependencies (if any)  

   ```bash
   npm install
   ```

2. Run a watch script to automatically reload the extension during development (example script):

   ```bash
   npm run watch
   ```

   *(Add a `watch` script to `package.json` that copies files to a temporary directory and reloads the extension via Chrome’s `chrome.runtime.reload()`.)*

3. After making changes, reload the extension on `chrome://extensions/` by clicking the **Reload** button.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.  
2. Create a new branch for your feature or bug fix.  
3. Ensure code follows the existing style and passes any linting checks.  
4. Open a pull request with a clear description of your changes.

## License

The project is currently **unlicensed**.

## FAQ

**Q: Can I use Focus-Tab on browsers other than Chrome?**  
A: The extension is built for Manifest V3, which is supported by Chromium‑based browsers (e.g., Edge, Brave). Adjust the `manifest.json` if needed for other browsers.

**Q: Where is the blacklist stored?**  
A: The blacklist is saved in `chrome.storage.local`, persisting across browser restarts.

**Q: How does the warning page work?**  
A: When a blocked URL is detected, the background script redirects the tab to `warning.html`, which displays a static motivational message. You can customize this page by editing `warning.html` and its inline CSS.

