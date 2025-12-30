# 🎯 Focus Tab – Stay Focused

A powerful Chrome extension that helps you stay productive by **blocking distracting websites during focus sessions** and combining it with a **Pomodoro timer** for structured deep work.

---

<p align="center">

  <!-- Version -->
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" />

  <!-- Chrome Extension -->
  <img src="https://img.shields.io/badge/Chrome%20Extension-MV3-orange?style=for-the-badge&logo=google-chrome" />

  <!-- OS Used -->
  <img src="https://img.shields.io/badge/Developed%20On-Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black" />

  <!-- Technologies -->
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-orange?style=for-the-badge&logo=html5" />
  <img src="https://img.shields.io/badge/CSS3-blue?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Chrome%20API-Extensions-red?style=for-the-badge&logo=google-chrome&logoColor=white" />

  <!-- AI Assistance -->
<img src="https://img.shields.io/badge/AI%20Assisted-DeepSeek-purple?style=for-the-badge" />


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

<p align="center">
  <a href="https://chromewebstore.google.com/detail/indebibipnljaahkjmaagonpcmhedemp">
    <img src="https://img.shields.io/badge/Available%20on-Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" />
  </a>
</p>


---

## 🔍 Introduction

**Focus Tab** helps you eliminate distractions by blocking selected websites **only during focus sessions**.  
It combines **website blocking**, a **Pomodoro timer**, motivational quotes, visual feedback, notifications, and productivity statistics.

Designed for **students, developers, professionals, and banking/office work** where deep focus matters.

---

## ✨ Features

### 🔒 Website Blocking (Focus Mode)
- Add / remove websites to a **persistent blacklist**
- Blacklist is stored safely using `chrome.storage.local`
- Websites are blocked **only when Focus Mode is active**
- One‑click **Start / Stop Focus Mode**
- Blocks:
  - Existing open tabs
  - New navigations in real time
- Clean motivational **warning page** for blocked sites
- Custom warning message support

---

### ⏱️ Pomodoro Timer 

Focus Tab follows a **classic, non‑editable Pomodoro cycle**:

- 🧠 **Work Session**: 25 minutes
  - Focus Mode automatically enabled
  - All blacklisted websites blocked

- ☕ **Break Session**: 5 minutes
  - Focus Mode automatically disabled
  - All websites allowed

- 🔁 **Auto‑Continue**
  - Automatically switches between Work ↔ Break
  - Runs continuously until stopped

- Single **Start Pomodoro** button
- Stop timer at any time

---

### 🎨 Visual Feedback
- Live countdown timer (MM:SS)
- Color‑coded UI:
  - Green → Work session
  - Blue → Break session
- Progress bar animation
- Minimal, distraction‑free popup UI

---

### 🔔 Notifications
- Desktop notifications for:
  - Work session started
  - Break session started
  - Session completed
- Helps you stay aware without checking the popup

---

### 🏷️ Extension Badge
- Toolbar badge shows **remaining minutes**
- Updates automatically every 30 seconds
- Different badge colors for Work / Break

---

### 📊 Productivity Stats
- Tracks:
  - Total completed work sessions
  - Total focus time (minutes)
- Stats persist across browser restarts

---

### ⚙️ Performance & Stability Improvements
- MV3‑safe **service worker architecture**
- In‑memory blacklist caching for fast navigation blocking
- Debounced state saving (prevents race conditions)
- Alarm‑based timer (survives background suspension)
- Tested against Chrome service‑worker restarts

---

## 📸 Screenshots

> *(Real usage screenshots)*

<img width="1366" height="768" alt="FC6" src="https://github.com/user-attachments/assets/d29e482d-12d4-4eef-ac66-e84db89fbe34" />

<img width="1366" height="768" alt="FC7" src="https://github.com/user-attachments/assets/e3298920-05cb-4a06-82cc-de7a8432339b" />

<img width="1366" height="768" alt="FC8" src="https://github.com/user-attachments/assets/23989bf0-9828-4a88-ab72-72f79fe2ff4b" />



---

## 🛠 Tech Stack

- **JavaScript (ES6+)**
- **HTML5**
- **CSS3**
- **Chrome Extension API (Manifest V3)**
- **Chrome Storage, Alarms & Notifications APIs**

---

## Project Structure

```
Focus-Tab/
├─ background.js          # Service worker handling tab monitoring and timer
├─ manifest.json          # Extension manifest (MV3)
├─ warning.js             # Generates motivational warning page
├─ icons/
│   └─ icon48.png         # Toolbar icon
├─ popup/
│   ├─ popup.html         # Popup UI markup
│   ├─ popup.css          # Popup styling
│   └─ popup.js           # Popup interaction logic
└─ README.md              # This document
```

## 🎯 Use Cases

- 🧠 **Deep Work Sessions**  
  Block distractions and maintain complete focus during important tasks.

- 📚 **Exam Preparation**  
  Stay disciplined by blocking social media and entertainment sites while studying.

- 💻 **Coding & Development**  
  Avoid context switching and maintain flow during long programming sessions.

- 🏢 **Office & Banking Work**  
  Improve productivity during work hours by limiting non-work-related websites.

- 📵 **Social Media Detox**  
  Reduce unnecessary scrolling by restricting access to distracting platforms.

- ⏱️ **Pomodoro Productivity Workflow**  
  Follow structured work–break cycles for sustainable productivity.


## ✅ Requirements

- Google Chrome / Chromium‑based browser (v88+)
- Developer mode enabled (for local installation)

---

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/vinothkumar2/Focus-Tab.git
```

2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top‑right)
4. Click **Load unpacked** and select the `Focus-Tab` folder

The extension will appear in the toolbar and is ready to use.

---
## ⚠️ Disclaimer

This extension is **actively maintained and continuously improved**.

The core functionality — website blocking, Focus Mode, and the Pomodoro workflow — is **stable and reliable**. However, as the project evolves, you may notice occasional minor bugs, performance tweaks, or user‑experience refinements.

Your feedback plays an important role in shaping future updates. Bug reports, feature requests, and suggestions are always welcome via **GitHub Issues**.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.  
2. Create a new branch for your feature or bug fix.  
3. Ensure your changes adhere to the existing code style.  
4. Test the extension by reloading it in Chrome.  
5. Open a pull request with a clear description of the changes.
