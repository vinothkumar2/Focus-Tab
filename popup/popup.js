document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  const activeSessionDisplay = document.getElementById('activeSessionDisplay');
  const timerElement = document.getElementById('timer');
  const timerStatus = document.getElementById('timerStatus');
  const progressBar = document.getElementById('progressBar');
  const endTimerBtn = document.getElementById('endTimer');

  // Focus Tab elements
  const siteList = document.getElementById('site-list');
  const siteInput = document.getElementById('site-input');
  const addButton = document.getElementById('add-button');
  const hideTabsBtn = document.getElementById('hideTabs');
  const restoreTabsBtn = document.getElementById('restoreTabs');
  const addCurrentSiteBtn = document.getElementById('addCurrentSite');
  const customMessageInput = document.getElementById('custom-message');
  const saveMessageBtn = document.getElementById('save-message');

  const sessionStatus = document.getElementById('sessionStatus');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');

  const currentSiteInfo = document.getElementById('currentSiteInfo');
  const currentSiteName = document.getElementById('currentSiteName');

  const blockedSitesCount = document.getElementById('blockedSitesCount');
  const workSessionsCount = document.getElementById('workSessionsCount');

  // Pomodoro
  const startPomodoroBtn = document.getElementById('startPomodoro');
  const autoContinueCheckbox = document.getElementById('autoContinue');
  const completedWorkSessions = document.getElementById('completedWorkSessions');
  const totalFocusTime = document.getElementById('totalFocusTime');

  // State
  let blacklist = [];
  let isFocusActive = false;
  let timerData = null;
  let timerInterval = null;

  let pomodoroStats = {
    workSessions: 0,
    totalMinutes: 0
  };

  // Init
  init();

  async function init() {
    await loadState();
    await updateCurrentSite();
    setupEventListeners();
    updateUI();
    startStatusUpdates();
  }

  async function loadState() {
    const blacklistResult = await sendMessage('get_blacklist');
    blacklist = blacklistResult.blacklist || [];
    renderBlacklist();

    const status = await sendMessage('get_session_status');
    isFocusActive = status.focusActive || false;

    if (status.timerActive) {
      timerData = {
        mode: status.timerMode,
        duration: status.timerDuration,
        endTime: status.timerEndTime
      };
      updateTimerDisplay();
    }

    const statsData = await chrome.storage.local.get(['pomodoroStats']);
    if (statsData.pomodoroStats) {
      pomodoroStats = statsData.pomodoroStats;
      updateStats();
    }

    const autoData = await chrome.storage.local.get(['autoContinue']);
    autoContinueCheckbox.checked = autoData.autoContinue !== false;
  }

  function setupEventListeners() {
    // Tabs
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Pomodoro start (FIXED 25 / 5)
    startPomodoroBtn.addEventListener('click', async () => {
      try {
        await sendMessage('start_work_timer', {
          minutes: 25,
          autoContinue: true
        });

        pomodoroStats.workSessions++;
        pomodoroStats.totalMinutes += 25;
        await chrome.storage.local.set({ pomodoroStats });
        updateStats();

        window.close();
      } catch {
        alert('Failed to start Pomodoro');
      }
    });

    // End timer
    endTimerBtn.addEventListener('click', async () => {
      await sendMessage('stop_timer');
      timerData = null;
      updateUI();
    });

    // Focus tab
    addButton.addEventListener('click', addSiteFromInput);
    siteInput.addEventListener('keypress', e => e.key === 'Enter' && addSiteFromInput());
    addCurrentSiteBtn.addEventListener('click', addCurrentSite);

    siteList.addEventListener('click', e => {
      if (e.target.classList.contains('remove-btn')) {
        removeSite(e.target.dataset.site);
      }
    });

    hideTabsBtn.addEventListener('click', startFocusSession);
    restoreTabsBtn.addEventListener('click', stopFocusSession);

    saveMessageBtn.addEventListener('click', saveCustomMessage);
  }

  function sendMessage(action, data = {}) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action, ...data }, resolve);
    });
  }

  function addSiteFromInput() {
    const site = siteInput.value.trim().toLowerCase();
    if (!site) return;
    addSite(site);
    siteInput.value = '';
  }

  async function addCurrentSite() {
    const res = await sendMessage('get_current_tab');
    if (res.hostname) addSite(res.hostname.replace('www.', ''));
  }

  async function addSite(site) {
    if (blacklist.includes(site)) return;
    const res = await sendMessage('add_to_blacklist', { site });
    if (res.success) {
      blacklist.push(site);
      renderBlacklist();
      updateStats();
    }
  }

  async function removeSite(site) {
    const res = await sendMessage('remove_from_blacklist', { site });
    if (res.success) {
      blacklist = blacklist.filter(s => s !== site);
      renderBlacklist();
      updateStats();
    }
  }

  function renderBlacklist() {
    siteList.innerHTML = '';
    if (!blacklist.length) {
      siteList.innerHTML = '<li style="opacity:.7;text-align:center">No blocked sites</li>';
      return;
    }
    blacklist.forEach(site => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${site}</span>
        <button class="remove-btn" data-site="${site}">Remove</button>
      `;
      siteList.appendChild(li);
    });
  }

  async function startFocusSession() {
    if (!blacklist.length) return alert('Add at least one site');
    await sendMessage('start_focus');
    isFocusActive = true;
    updateUI();
  }

  async function stopFocusSession() {
    await sendMessage('stop_focus');
    isFocusActive = false;
    updateUI();
  }

  function updateTimerDisplay() {
    if (!timerData) {
      activeSessionDisplay.style.display = 'none';
      return;
    }

    const remaining = timerData.endTime - Date.now();
    if (remaining <= 0) return;

    activeSessionDisplay.style.display = 'block';
    activeSessionDisplay.className =
      'active-session-display ' + (timerData.mode === 'work' ? 'work-mode' : 'break-mode');

    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    timerElement.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    timerStatus.textContent =
      timerData.mode === 'work' ? 'Work Session (25 min)' : 'Break (5 min)';

    const elapsed = timerData.duration * 60000 - remaining;
    progressBar.style.width = `${(elapsed / (timerData.duration * 60000)) * 100}%`;

    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  }

  function updateUI() {
    statusIcon.textContent = isFocusActive ? '▶️' : '⏸️';
    statusText.textContent = isFocusActive ? 'Focus mode ACTIVE' : 'Focus mode not active';
    hideTabsBtn.style.display = isFocusActive ? 'none' : 'flex';
    restoreTabsBtn.style.display = isFocusActive ? 'flex' : 'none';
    updateTimerDisplay();
    updateStats();
  }

  function updateStats() {
    blockedSitesCount.textContent = blacklist.length;
    workSessionsCount.textContent = pomodoroStats.workSessions;
    completedWorkSessions.textContent = pomodoroStats.workSessions;
    totalFocusTime.textContent = pomodoroStats.totalMinutes;
  }

  async function updateCurrentSite() {
    const res = await sendMessage('get_current_tab');
    if (res.hostname) {
      currentSiteInfo.style.display = 'block';
      currentSiteName.textContent = res.hostname;
    }
  }

  async function saveCustomMessage() {
    await chrome.storage.local.set({ customWarningMessage: customMessageInput.value.trim() });
    saveMessageBtn.textContent = 'Saved!';
    setTimeout(() => (saveMessageBtn.textContent = 'Save Message'), 1500);
  }

  function startStatusUpdates() {
    setInterval(async () => {
      const status = await sendMessage('get_session_status');

      isFocusActive = status.focusActive;
      if (status.timerActive) {
        timerData = {
          mode: status.timerMode,
          duration: status.timerDuration,
          endTime: status.timerEndTime
        };
      } else {
        timerData = null;
      }
      updateUI();
    }, 1000);
  }
});
