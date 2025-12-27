// Global state
let focusState = {
  active: false,
  hiddenTabs: [],
  blacklist: []
};

let timerState = {
  active: false,
  mode: null,
  duration: 0,
  endTime: null,
  startTime: null,
  autoContinue: false
};

// Initialize
chrome.runtime.onInstalled.addListener(loadStateFromStorage);
chrome.runtime.onStartup.addListener(loadStateFromStorage);

// =========================
// SAFE STATE LOADING (FIX)
// =========================
async function loadStateFromStorage() {
  try {
    const data = await chrome.storage.local.get([
      'focusState',
      'timerState',
      'blacklist',
      'blacklistSites' // legacy
    ]);

    /* ---- BLACKLIST: SOURCE OF TRUTH ---- */
    let storedBlacklist = [];

    if (Array.isArray(data.blacklist) && data.blacklist.length > 0) {
      storedBlacklist = data.blacklist;
    } else if (Array.isArray(data.blacklistSites) && data.blacklistSites.length > 0) {
      storedBlacklist = data.blacklistSites;
    }

    /* ---- FOCUS STATE (SAFE MERGE) ---- */
    if (data.focusState) {
      focusState.active = data.focusState.active || false;
      focusState.hiddenTabs = data.focusState.hiddenTabs || [];
    }

    // 🔒 PROTECT BLACKLIST
    if (storedBlacklist.length > 0) {
      focusState.blacklist = storedBlacklist;
    } else if (!Array.isArray(focusState.blacklist)) {
      focusState.blacklist = [];
    }

    /* ---- TIMER STATE ---- */
    if (data.timerState) {
      timerState = data.timerState;
    }

    // Resume focus mode
    if (focusState.active) {
      startNavigationMonitoring();
      updateIcon();
    }

    // Resume timer
    if (timerState.active && timerState.endTime) {
      const remaining = timerState.endTime - Date.now();
      if (remaining > 0) {
        scheduleAlarm(Math.ceil(remaining / 60000));
        if (timerState.mode === 'work' && !focusState.active) {
          await startFocusMode();
        }
      } else {
        await handleTimerEnd();
      }
    }

    // Persist clean state
    await saveState();

  } catch (error) {
    console.error('Error loading state:', error);
  }
}

// =========================
// SAFE SAVE (FIX)
// =========================
async function saveState() {
  try {
    await chrome.storage.local.set({
      focusState: {
        active: focusState.active,
        hiddenTabs: focusState.hiddenTabs
      },
      timerState: timerState,
      blacklist: Array.isArray(focusState.blacklist)
        ? focusState.blacklist
        : []
    });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// =========================
// MESSAGE HANDLER (UNCHANGED)
// =========================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  (async () => {
    switch (request.action) {

      case 'get_session_status':
        sendResponse({
          focusActive: focusState.active,
          timerActive: timerState.active,
          timerMode: timerState.mode,
          timerEndTime: timerState.endTime,
          timerDuration: timerState.duration
        });
        break;

      case 'start_focus':
        await startFocusMode();
        sendResponse({ success: true });
        break;

      case 'stop_focus':
        await stopFocusMode();
        sendResponse({ success: true });
        break;

      case 'add_to_blacklist': {
        const site = request.site.toLowerCase().trim();
        if (site && !focusState.blacklist.includes(site)) {
          focusState.blacklist.push(site);
          await saveState();
        }
        sendResponse({ success: true });
        break;
      }

      case 'remove_from_blacklist':
        focusState.blacklist = focusState.blacklist.filter(s => s !== request.site);
        await saveState();
        sendResponse({ success: true });
        break;

      case 'get_blacklist':
        sendResponse({ blacklist: focusState.blacklist });
        break;

      case 'get_current_tab':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            try {
              const url = new URL(tabs[0].url);
              sendResponse({ hostname: url.hostname, url: tabs[0].url });
            } catch {
              sendResponse({ hostname: '', url: tabs[0].url });
            }
          } else {
            sendResponse({ hostname: '', url: '' });
          }
        });
        return;

      case 'start_work_timer':
        await startWorkTimer(request.minutes, request.autoContinue);
        sendResponse({ success: true });
        break;

      case 'start_break_timer':
        await startBreakTimer(request.minutes, request.autoContinue);
        sendResponse({ success: true });
        break;

      case 'stop_timer':
        await stopTimer();
        sendResponse({ success: true });
        break;

      case 'set_auto_continue':
        timerState.autoContinue = request.enabled;
        await saveState();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, message: 'Unknown action' });
    }
  })();

  return true; // ✅ keep service worker alive
});


// Focus mode functions
async function startFocusMode() {
  if (focusState.active) {
    console.log('Focus mode already active');
    return;
  }
  
  console.log('Starting focus mode with blacklist:', focusState.blacklist);
  
  try {
    const tabs = await chrome.tabs.query({});
    const tabsToHide = [];
    
    for (const tab of tabs) {
      if (!tab.url) continue;
      
      // Skip internal URLs
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url === '' || 
          tab.url === 'about:blank') {
        continue;
      }
      
      // Check if tab should be blocked
      let shouldBlock = false;
      for (const site of focusState.blacklist) {
        try {
          const url = new URL(tab.url);
          const hostname = url.hostname.toLowerCase();
          const cleanSite = site.toLowerCase()
            .replace('www.', '')
            .replace('https://', '')
            .replace('http://', '')
            .replace('/', '');
          
          if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
            shouldBlock = true;
            break;
          }
        } catch (e) {
          console.log('Error parsing URL:', tab.url, e);
        }
      }
      
      if (shouldBlock) {
        tabsToHide.push(tab);
      }
    }
    
    console.log(`Found ${tabsToHide.length} tabs to hide`);
    
    // Save tabs before removing
    focusState.hiddenTabs = tabsToHide.map(tab => ({
      url: tab.url,
      title: tab.title,
      id: tab.id
    }));
    
    // Remove tabs
    for (const tab of tabsToHide) {
      try {
        await chrome.tabs.remove(tab.id);
        console.log('Removed tab:', tab.url);
      } catch (error) {
        console.error('Error removing tab:', error);
      }
    }
    
    focusState.active = true;
    await saveState();
    startNavigationMonitoring();
    updateIcon();
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Mode Started',
      message: `Blocked ${tabsToHide.length} distracting tabs`
    });
    
    console.log('Focus mode started successfully');
    
  } catch (error) {
    console.error('Error starting focus mode:', error);
  }
}

async function stopFocusMode() {
  if (!focusState.active) {
    console.log('Focus mode not active');
    return;
  }
  
  console.log('Stopping focus mode, restoring', focusState.hiddenTabs.length, 'tabs');
  
  try {
    // Restore hidden tabs
    for (const tab of focusState.hiddenTabs) {
      try {
        await chrome.tabs.create({ url: tab.url });
        console.log('Restored tab:', tab.url);
      } catch (error) {
        console.error('Error restoring tab:', error);
      }
    }
    
    focusState.active = false;
    focusState.hiddenTabs = [];
    await saveState();
    stopNavigationMonitoring();
    updateIcon();
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Mode Ended',
      message: 'All tabs have been restored'
    });
    
    console.log('Focus mode stopped successfully');
    
  } catch (error) {
    console.error('Error stopping focus mode:', error);
  }
}

// Timer functions
async function startWorkTimer(minutes, autoContinue = false) {
  console.log(`Starting work timer for ${minutes} minutes`);
  
  // Clear existing timer
  await stopTimer();
  
  // Set timer state
  timerState = {
    active: true,
    mode: 'work',
    duration: minutes,
    startTime: Date.now(),
    endTime: Date.now() + (minutes * 60000),
    autoContinue: autoContinue
  };
  
  await saveState();
  
  // Start focus mode
  await startFocusMode();
  
  // Schedule alarm
  scheduleAlarm(minutes);
  
  updateIcon();
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Work Session Started',
    message: `${minutes}-minute work session started`
  });
  
  console.log('Work timer started');
}

async function startBreakTimer(minutes, autoContinue = false) {
  console.log(`Starting break timer for ${minutes} minutes`);
  
  // Clear existing timer
  await stopTimer();
  
  // Set timer state
  timerState = {
    active: true,
    mode: 'break',
    duration: minutes,
    startTime: Date.now(),
    endTime: Date.now() + (minutes * 60000),
    autoContinue: autoContinue
  };
  
  await saveState();
  
  // Stop focus mode during break
  if (focusState.active) {
    await stopFocusMode();
  }
  
  // Schedule alarm
  scheduleAlarm(minutes);
  
  updateIcon();
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Break Started',
    message: `${minutes}-minute break started`
  });
  
  console.log('Break timer started');
}

async function stopTimer() {
  console.log('Stopping timer');
  
  timerState.active = false;
  timerState.mode = null;
  timerState.endTime = null;
  
  await saveState();
  chrome.alarms.clear('timer_end');
  updateIcon();
}

function scheduleAlarm(minutes) {
  chrome.alarms.create('timer_end', {
    delayInMinutes: minutes
  });
}

// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timer_end') {
    console.log('Timer ended, handling...');
    await handleTimerEnd();
  }
});

// Handle timer end
async function handleTimerEnd() {
  if (!timerState.active) return;
  
  const wasWorkMode = timerState.mode === 'work';
  const autoContinue = timerState.autoContinue;
  
  console.log(`Timer ended: ${wasWorkMode ? 'Work' : 'Break'} mode, autoContinue: ${autoContinue}`);
  
  // Stop current timer
  timerState.active = false;
  timerState.mode = null;
  timerState.endTime = null;
  await saveState();
  
  updateIcon();
  
  // Show notification
  if (wasWorkMode) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Work Session Complete! 🎉',
      message: 'Great job! Time for a break.',
      priority: 2
    });
    
    // Auto start break timer if enabled
    if (autoContinue) {
      console.log('Auto-continue enabled, starting break timer');
      // Wait 2 seconds then start 5-minute break
      setTimeout(() => {
        startBreakTimer(5, true);
      }, 2000);
    }
    
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Break Time Over',
      message: 'Ready for another work session?',
      priority: 2
    });
    
    // Auto start work timer if enabled
    if (autoContinue) {
      console.log('Auto-continue enabled, starting work timer');
      // Wait 2 seconds then start 25-minute work session
      setTimeout(() => {
        startWorkTimer(25, true);
      }, 2000);
    }
  }
}

// Update extension icon
function updateIcon() {
  const iconPaths = {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  };
  
  // Set badge based on state
  if (timerState.active) {
    // Show countdown on badge
    if (timerState.endTime) {
      const remainingMs = timerState.endTime - Date.now();
      const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
      
      chrome.action.setBadgeText({ text: remainingMinutes.toString() });
      
      if (timerState.mode === 'work') {
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green
      } else {
        chrome.action.setBadgeBackgroundColor({ color: '#2196F3' }); // Blue
      }
    }
  } else if (focusState.active) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF9800' }); // Orange
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Navigation monitoring
let navigationListener = null;

function startNavigationMonitoring() {
  if (navigationListener) return;
  
  navigationListener = async (details) => {
    if (!focusState.active) return;
    
    try {
      const url = new URL(details.url);
      const hostname = url.hostname.toLowerCase();
      
      // Skip internal URLs
      if (url.protocol === 'chrome:' || 
          url.protocol === 'chrome-extension:' ||
          url.protocol === 'about:') {
        return;
      }
      
      // Check if URL is blocked
      for (const site of focusState.blacklist) {
        const cleanSite = site.toLowerCase()
          .replace('www.', '')
          .replace('https://', '')
          .replace('http://', '')
          .replace('/', '');
        
        if (hostname.includes(cleanSite) || cleanSite.includes(hostname)) {
          console.log('Blocking navigation to:', hostname);
          await chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL(`warning.html?site=${encodeURIComponent(hostname)}`)
          });
          return;
        }
      }
    } catch (error) {
      // Invalid URL, ignore
    }
  };
  
  chrome.webNavigation.onBeforeNavigate.addListener(navigationListener);
  console.log('Navigation monitoring started');
}

function stopNavigationMonitoring() {
  if (navigationListener) {
    chrome.webNavigation.onBeforeNavigate.removeListener(navigationListener);
    navigationListener = null;
  }
  console.log('Navigation monitoring stopped');
}

// Update icon every minute for timer countdown
setInterval(() => {
  if (timerState.active) {
    updateIcon();
  }
}, 30000); // Update every 30 seconds

// Save state periodically to ensure persistence
setInterval(async () => {
  if (focusState.active || timerState.active) {
    await saveState();
  }
}, 60000); // Save every minute
