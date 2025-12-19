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
  
  // Timer elements
  const timeOptions = document.querySelectorAll('.time-option');
  const workTimeInput = document.getElementById('workTime');
  const breakTimeInput = document.getElementById('breakTime');
  const startWorkBtn = document.getElementById('startWork');
  const startBreakBtn = document.getElementById('startBreak');
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
  
  // Initialize
  init();
  
  async function init() {
    await loadState();
    await updateCurrentSite();
    setupEventListeners();
    updateUI();
    startStatusUpdates();
  }
  
  async function loadState() {
    try {
      // Load blacklist
      const blacklistResult = await sendMessage('get_blacklist');
      blacklist = blacklistResult.blacklist || [];
      renderBlacklist();
      
      // Load session status
      const status = await sendMessage('get_session_status');
      isFocusActive = status.focusActive || false;
      
      // Load timer status
      if (status.timerActive) {
        timerData = {
          mode: status.timerMode,
          duration: status.timerDuration,
          endTime: status.timerEndTime
        };
        updateTimerDisplay();
      }
      
      // Load stats
      const statsData = await chrome.storage.local.get(['pomodoroStats']);
      if (statsData.pomodoroStats) {
        pomodoroStats = statsData.pomodoroStats;
        updateStats();
      }
      
      // Load custom message
      const messageData = await chrome.storage.local.get(['customWarningMessage']);
      if (messageData.customWarningMessage) {
        customMessageInput.value = messageData.customWarningMessage;
      }
      
      // Load auto-continue setting
      const settings = await chrome.storage.local.get(['autoContinue']);
      if (settings.autoContinue !== undefined) {
        autoContinueCheckbox.checked = settings.autoContinue;
      }
      
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
  
  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === tabId) {
            content.classList.add('active');
          }
        });
      });
    });
    
    // Time options selection
    timeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const minutes = parseInt(option.dataset.minutes);
        const isWorkOption = option.closest('.work-controls');
        
        // Remove selection from all options in same group
        const group = option.closest('.work-controls, .break-controls');
        group.querySelectorAll('.time-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Select clicked option
        option.classList.add('selected');
        
        // Update the corresponding input
        if (isWorkOption) {
          workTimeInput.value = minutes;
        } else {
          breakTimeInput.value = minutes;
        }
      });
    });
    
    // Custom time inputs
    workTimeInput.addEventListener('change', () => {
      const value = parseInt(workTimeInput.value);
      if (value >= 1 && value <= 120) {
        // Update selection
        const workControls = workTimeInput.closest('.work-controls');
        workControls.querySelectorAll('.time-option').forEach(opt => {
          opt.classList.remove('selected');
        });
      }
    });
    
    breakTimeInput.addEventListener('change', () => {
      const value = parseInt(breakTimeInput.value);
      if (value >= 1 && value <= 60) {
        // Update selection
        const breakControls = breakTimeInput.closest('.break-controls');
        breakControls.querySelectorAll('.time-option').forEach(opt => {
          opt.classList.remove('selected');
        });
      }
    });
    
    // Auto-continue checkbox
    autoContinueCheckbox.addEventListener('change', async () => {
      await sendMessage('set_auto_continue', { enabled: autoContinueCheckbox.checked });
      await chrome.storage.local.set({ autoContinue: autoContinueCheckbox.checked });
    });
    
    // Start work timer
    startWorkBtn.addEventListener('click', async () => {
      const minutes = workTimeInput.value || 25;
      if (minutes >= 1) {
        try {
          const autoContinue = autoContinueCheckbox.checked;
          await sendMessage('start_work_timer', { 
            minutes: parseInt(minutes),
            autoContinue: autoContinue
          });
          
          // Update stats
          pomodoroStats.workSessions++;
          pomodoroStats.totalMinutes += parseInt(minutes);
          await chrome.storage.local.set({ pomodoroStats });
          updateStats();
          
          window.close();
        } catch (error) {
          console.error('Failed to start work timer:', error);
        }
      }
    });
    
    // Start break timer
    startBreakBtn.addEventListener('click', async () => {
      const minutes = breakTimeInput.value || 5;
      if (minutes >= 1) {
        try {
          const autoContinue = autoContinueCheckbox.checked;
          await sendMessage('start_break_timer', { 
            minutes: parseInt(minutes),
            autoContinue: autoContinue
          });
          window.close();
        } catch (error) {
          console.error('Failed to start break timer:', error);
        }
      }
    });
    
    // End timer
    endTimerBtn.addEventListener('click', async () => {
      try {
        await sendMessage('stop_timer');
        timerData = null;
        updateUI();
      } catch (error) {
        console.error('Failed to stop timer:', error);
      }
    });
    
    // Focus tab events
    addButton.addEventListener('click', addSiteFromInput);
    siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addSiteFromInput();
    });
    
    addCurrentSiteBtn.addEventListener('click', addCurrentSite);
    
    siteList.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        removeSite(e.target.dataset.site);
      }
    });
    
    // Focus session buttons
    hideTabsBtn.addEventListener('click', startFocusSession);
    restoreTabsBtn.addEventListener('click', stopFocusSession);
    
    // Save custom message
    saveMessageBtn.addEventListener('click', saveCustomMessage);
  }
  
  // Helper function for message passing
  function sendMessage(action, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
  
  // Site management functions
  function addSiteFromInput() {
    const site = siteInput.value.trim().toLowerCase();
    if (site && !blacklist.includes(site)) {
      addSite(site);
      siteInput.value = '';
    }
  }
  
  async function addCurrentSite() {
    try {
      const response = await sendMessage('get_current_tab');
      if (response && response.hostname) {
        const site = response.hostname.toLowerCase().replace('www.', '');
        addSite(site);
      }
    } catch (error) {
      console.error('Failed to get current site:', error);
    }
  }
  
  async function addSite(site) {
    if (!blacklist.includes(site)) {
      blacklist.push(site);
      await sendMessage('add_to_blacklist', { site });
      renderBlacklist();
      updateStats();
    }
  }
  
  async function removeSite(site) {
    blacklist = blacklist.filter(s => s !== site);
    await sendMessage('remove_from_blacklist', { site });
    renderBlacklist();
    updateStats();
  }
  
  function renderBlacklist() {
    siteList.innerHTML = '';
    
    if (blacklist.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No sites in blacklist. Add some to get started!';
      li.style.textAlign = 'center';
      li.style.opacity = '0.7';
      li.style.fontStyle = 'italic';
      siteList.appendChild(li);
    } else {
      blacklist.forEach(site => {
        const li = document.createElement('li');
        
        const siteSpan = document.createElement('span');
        siteSpan.textContent = site;
        siteSpan.style.flex = '1';
        siteSpan.style.overflow = 'hidden';
        siteSpan.style.textOverflow = 'ellipsis';
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-btn');
        removeBtn.dataset.site = site;
        
        li.appendChild(siteSpan);
        li.appendChild(removeBtn);
        siteList.appendChild(li);
      });
    }
  }
  
  // Session functions
  async function startFocusSession() {
    if (blacklist.length === 0) {
      alert('Please add at least one site to your blacklist first!');
      return;
    }
    
    try {
      await sendMessage('start_focus');
      isFocusActive = true;
      updateUI();
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  }
  
  async function stopFocusSession() {
    try {
      await sendMessage('stop_focus');
      isFocusActive = false;
      updateUI();
    } catch (error) {
      console.error('Failed to stop focus session:', error);
    }
  }
  
  // Timer display functions
  function updateTimerDisplay() {
    if (!timerData || !timerData.endTime) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      activeSessionDisplay.style.display = 'none';
      return;
    }
    
    const now = Date.now();
    const remaining = timerData.endTime - now;
    
    if (remaining <= 0) {
      // Timer ended
      timerData = null;
      updateUI();
      return;
    }
    
    // Update timer display
    activeSessionDisplay.style.display = 'block';
    activeSessionDisplay.className = 'active-session-display ' + (timerData.mode === 'work' ? 'work-mode' : 'break-mode');
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const modeName = timerData.mode === 'work' ? 'Work Session' : 'Break Time';
    timerStatus.textContent = `${modeName} - ${timerData.duration} minutes`;
    
    // Update progress bar
    const elapsed = timerData.duration * 60000 - remaining;
    const progress = (elapsed / (timerData.duration * 60000)) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Start interval if not already running
    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  }
  
  // UI Update functions
  function updateUI() {
    // Update focus status
    if (isFocusActive) {
      statusIcon.textContent = '▶️';
      statusText.textContent = 'Focus mode is ACTIVE';
      sessionStatus.className = 'session-info active';
      hideTabsBtn.style.display = 'none';
      restoreTabsBtn.style.display = 'flex';
    } else {
      statusIcon.textContent = '⏸️';
      statusText.textContent = 'Focus mode is not active';
      sessionStatus.className = 'session-info';
      hideTabsBtn.style.display = 'flex';
      restoreTabsBtn.style.display = 'none';
    }
    
    // Update timer display
    updateTimerDisplay();
    
    // Update stats
    updateStats();
  }
  
  function updateStats() {
    blockedSitesCount.textContent = blacklist.length;
    workSessionsCount.textContent = pomodoroStats.workSessions;
    completedWorkSessions.textContent = pomodoroStats.workSessions;
    totalFocusTime.textContent = pomodoroStats.totalMinutes;
  }
  
  async function updateCurrentSite() {
    try {
      const response = await sendMessage('get_current_tab');
      if (response && response.hostname) {
        currentSiteInfo.style.display = 'block';
        currentSiteName.textContent = response.hostname;
      } else {
        currentSiteInfo.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to get current site:', error);
    }
  }
  
  async function saveCustomMessage() {
    const message = customMessageInput.value.trim();
    if (message) {
      await chrome.storage.local.set({ customWarningMessage: message });
      saveMessageBtn.textContent = 'Saved!';
      saveMessageBtn.classList.add('saved');
      setTimeout(() => {
        saveMessageBtn.textContent = 'Save Message';
        saveMessageBtn.classList.remove('saved');
      }, 2000);
    }
  }
  
  // Periodic status updates
  function startStatusUpdates() {
    setInterval(async () => {
      try {
        const status = await sendMessage('get_session_status');
        
        // Update focus status
        if (status.focusActive !== isFocusActive) {
          isFocusActive = status.focusActive;
          updateUI();
        }
        
        // Update timer status
        if (status.timerActive) {
          if (!timerData || timerData.endTime !== status.timerEndTime) {
            timerData = {
              mode: status.timerMode,
              duration: status.timerDuration,
              endTime: status.timerEndTime
            };
            updateTimerDisplay();
          }
        } else if (timerData) {
          timerData = null;
          updateUI();
        }
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }, 1000);
  }
  
  // Initial UI update
  updateUI();
});
