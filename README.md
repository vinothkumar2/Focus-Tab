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
  <img src="https://img.shields.io/badge/Built%20with-DeepSeek%20AI-purple?style=for-the-badge" />

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

---

## 🔍 Introduction

**Focus Tab** helps you eliminate distractions by blocking selected websites **only during focus sessions**.  
It combines **website blocking**, a **Pomodoro timer**, motivational quotes, visual feedback, notifications, and productivity statistics.

Designed for students, developers, professionals, and anyone who wants to practice deep work.

---

## ✨ Features

### 🔒 Focus Tab (Website Blocking)
- Add or remove websites from a blacklist
- Block sites **only when focus mode is active**
- One-click **Start / End Focus Mode**
- Custom warning messages
- Motivational quote-based blocking page
- Clean and distraction-free UI

---

### ⏱️ Pomodoro Timer
- **Work Mode**
  - Automatically enables focus mode
  - Blocks all blacklisted sites
- **Break Mode**
  - Automatically disables focus mode
  - Allows all websites
- Preset durations:
  - Work: 15, 20, 25, 30, 45 minutes
  - Break: 1, 2, 3, 5, 10, 15 minutes
- **Auto-Continue**
  - Automatically switches between work & break sessions

---

### 🎨 Visual Feedback
- Color-coded UI for work & break
- Live countdown timer
- Progress bar animation
- Dark-mode friendly design

---

### 🔔 Notifications
- Alerts when:
  - Work session starts
  - Break session starts
  - Session ends

---

### 🏷️ Extension Badge
- Shows **remaining minutes** on the toolbar icon
- Updates in real time during sessions

---

### 📊 Productivity Statistics
- Tracks:
  - Total work sessions
  - Total focus time (minutes)

---

## 📸 Screenshots

> *(Real usage screenshots)*

<img width="1366" height="768" alt="FOC1" src="https://github.com/user-attachments/assets/96002e28-8798-423b-ba0d-8b0c5c37f4eb" />

<img width="1366" height="768" alt="FOC2" src="https://github.com/user-attachments/assets/2659679d-ce1f-4cad-9b73-6601913bd999" />

<img width="1366" height="768" alt="FOC3" src="https://github.com/user-attachments/assets/67985451-8529-4130-ae1d-5e4a1c5321ff" />

<img width="1366" height="768" alt="FOC4" src="https://github.com/user-attachments/assets/93661dd7-8f11-4fb6-ae59-98633f77ef8f" />

<img width="1366" height="768" alt="FOC5" src="https://github.com/user-attachments/assets/c80a89fa-8077-4ac3-97bd-8fecc6dc1c4a" />

<img width="1366" height="768" alt="FOC6" src="https://github.com/user-attachments/assets/73bca5da-74e5-4073-914e-46f216d3b086" />

<img width="1366" height="768" alt="FOC7" src="https://github.com/user-attachments/assets/bef536a7-55ef-4992-a836-07891e184483" />

<img width="1366" height="768" alt="FOC8" src="https://github.com/user-attachments/assets/e092a42b-82dc-458c-97ec-ac8d44888bc4" />



---

## 🛠 Tech Stack

- **JavaScript (ES6+)**
- **HTML5**
- **CSS3**
- **Chrome Extension API (Manifest V3)**
- **Chrome Storage, Alarms & Notifications APIs**

---

## Prerequisites / Requirements

- Google Chrome (or any Chromium‑based browser) version 88 or later  
- Basic knowledge of Chrome extensions for optional development  

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/vinothkumar2/Focus-Tab.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.

3. Enable **Developer mode** (toggle in the top‑right corner).

4. Click **Load unpacked** and select the `Focus-Tab` folder you just cloned.

The extension will appear in the toolbar and is ready to use.

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


## Development

If you wish to modify or extend the extension:

1. Make your changes in the source files (`background.js`, `popup/*`, `warning.js`).  
2. In `chrome://extensions/`, click the **Reload** button on the Focus‑Tab entry to apply changes.  
3. Use Chrome’s **Developer Tools** (Console, Sources) to debug background scripts and popup UI.  

No additional build step is required; the extension runs directly from the source files.

## ⚠️ Disclaimer

This extension is currently **under active development**.  
While the core features are stable, you may encounter minor bugs or unexpected behavior.

The issues will be **identified and fixed in upcoming updates**.  
Your feedback and bug reports are highly appreciated and will help improve the extension.

If you face any problems, please consider opening an issue in the GitHub repository.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.  
2. Create a new branch for your feature or bug fix.  
3. Ensure your changes adhere to the existing code style.  
4. Test the extension by reloading it in Chrome.  
5. Open a pull request with a clear description of the changes.
