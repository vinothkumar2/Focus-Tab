// Global state
let focusState = {
  active: false,
  hiddenTabs: [],
  blacklist: []
};

let timerState = {
  active: false,
  mode: null, // 'work' or 'break'
  duration: 0,
  endTime: null,
  startTime: null,
  autoContinue: false // Auto switch to next mode
};

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  loadState();
});

chrome.runtime.onStartup.addListener(() => {
  loadState();
});

// Load state from storage
async function loadState() {
  try {
    const data = await chrome.storage.local.get([
      'focusState', 'timerState', 'blacklistSites'
    ]);
    
    if (data.focusState) {
      focusState = data.focusState;
      if (focusState.active) {
        startNavigationMonitoring();
        updateIcon();
      }
    }
    
    if (data.timerState) {
      timerState = data.timerState;
      if (timerState.active && timerState.endTime) {
        const now = Date.now();
        if (now < timerState.endTime) {
          // Resume timer
          const remainingMs = timerState.endTime - now;
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          scheduleAlarm(remainingMinutes);
          updateIcon();
        } else {
          // Timer expired
          await handleTimerEnd();
        }
      }
    }
    
    if (data.blacklistSites) {
      focusState.blacklist = data.blacklistSites;
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
}

// Save state
async function saveState() {
  try {
    await chrome.storage.local.set({
      focusState: focusState,
      timerState: timerState
    });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);
  
  const handleRequest = async () => {
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
        
      case 'add_to_blacklist':
        const site = request.site.toLowerCase().trim();
        if (site && !focusState.blacklist.includes(site)) {
          focusState.blacklist.push(site);
          await chrome.storage.local.set({ blacklistSites: focusState.blacklist });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        break;
        
      case 'remove_from_blacklist':
        focusState.blacklist = focusState.blacklist.filter(s => s !== request.site);
        await chrome.storage.local.set({ blacklistSites: focusState.blacklist });
        sendResponse({ success: true });
        break;
        
      case 'get_blacklist':
        sendResponse({ blacklist: focusState.blacklist });
        break;
        
      case 'get_current_tab':
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url) {
            try {
              const url = new URL(tabs[0].url);
              sendResponse({ 
                hostname: url.hostname,
                url: tabs[0].url
              });
            } catch (e) {
              sendResponse({ hostname: '', url: tabs[0].url });
            }
          } else {
            sendResponse({ hostname: '', url: '' });
          }
        });
        return true;
        
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
    }
  };
  
  handleRequest();
  return true;
});

// Focus mode functions
async function startFocusMode() {
  if (focusState.active) return;
  
  console.log('Starting focus mode...');
  
  try {
    const tabs = await chrome.tabs.query({});
    const tabsToHide = [];
    
    for (const tab of tabs) {
      if (!tab.url) continue;
      
      // Skip internal URLs
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://')) {
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
            .replace('http://', '');
          
          if (hostname.includes(cleanSite)) {
            shouldBlock = true;
            break;
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
      
      if (shouldBlock) {
        tabsToHide.push(tab);
      }
    }
    
    // Save tabs before removing
    focusState.hiddenTabs = tabsToHide.map(tab => ({
      url: tab.url,
      title: tab.title,
      id: tab.id
    }));
    
    // Remove tabs
    for (const tab of tabsToHide) {
      await chrome.tabs.remove(tab.id);
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
    
  } catch (error) {
    console.error('Error starting focus mode:', error);
  }
}

async function stopFocusMode() {
  if (!focusState.active) return;
  
  console.log('Stopping focus mode...');
  
  try {
    // Restore hidden tabs
    for (const tab of focusState.hiddenTabs) {
      await chrome.tabs.create({ url: tab.url });
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
      // Default break time is 5 minutes
      setTimeout(() => {
        startBreakTimer(5, true);
      }, 2000); // 2 second delay
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
      // Default work time is 25 minutes
      setTimeout(() => {
        startWorkTimer(25, true);
      }, 2000); // 2 second delay
    }
  }
}

// Update extension icon
function updateIcon() {
  if (timerState.active) {
    if (timerState.endTime) {
      const remainingMs = timerState.endTime - Date.now();
      const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
      
      chrome.action.setBadgeText({ text: remainingMinutes.toString() });
      
      if (timerState.mode === 'work') {
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green
        chrome.action.setIcon({
          path: {
            16: 'icons/icon16-work.png',
            48: 'icons/icon48-work.png',
            128: 'icons/icon128-work.png'
          }
        });
      } else {
        chrome.action.setBadgeBackgroundColor({ color: '#2196F3' }); // Blue
        chrome.action.setIcon({
          path: {
            16: 'icons/icon16-break.png',
            48: 'icons/icon48-break.png',
            128: 'icons/icon128-break.png'
          }
        });
      }
    }
  } else if (focusState.active) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF9800' }); // Orange
    chrome.action.setIcon({
      path: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png'
      }
    });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setIcon({
      path: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png'
      }
    });
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
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
        return;
      }
      
      // Check if URL is blocked
      for (const site of focusState.blacklist) {
        const cleanSite = site.toLowerCase()
          .replace('www.', '')
          .replace('https://', '')
          .replace('http://', '');
        
        if (hostname.includes(cleanSite)) {
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
}

function stopNavigationMonitoring() {
  if (navigationListener) {
    chrome.webNavigation.onBeforeNavigate.removeListener(navigationListener);
    navigationListener = null;
  }
}

// Update icon regularly for countdown
setInterval(() => {
  if (timerState.active) {
    updateIcon();
  }
}, 30000); // Update every 30 seconds
