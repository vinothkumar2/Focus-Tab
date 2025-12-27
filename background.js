// ======================
// GLOBAL STATE
// ======================

let focusState = {
  active: false,
  hiddenTabs: []
};

let timerState = {
  active: false,
  mode: null,
  duration: 0,
  endTime: null,
  startTime: null,
  autoContinue: false
};

// In-memory blacklist cache (performance fix)
let cachedBlacklist = [];

// Prevent overlapping saves
let saveInProgress = false;

// ======================
// INIT
// ======================

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  loadStateFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started');
  loadStateFromStorage();
});

// ======================
// LOAD STATE
// ======================

async function loadStateFromStorage() {
  try {
    console.log('Loading state from storage...');

    const data = await chrome.storage.local.get([
      'focusState',
      'timerState',
      'blacklist'
    ]);

    // ---- BLACKLIST (SOURCE OF TRUTH) ----
    if (!Array.isArray(data.blacklist)) {
      console.log('Blacklist key missing, initializing once');
      await chrome.storage.local.set({ blacklist: [] });
      cachedBlacklist = [];
    } else {
      cachedBlacklist = data.blacklist;
    }

    // ---- FOCUS STATE ----
    if (data.focusState) {
      focusState.active = Boolean(data.focusState.active);
      focusState.hiddenTabs = Array.isArray(data.focusState.hiddenTabs)
        ? data.focusState.hiddenTabs
        : [];
    }

    // ---- TIMER STATE ----
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

    console.log('State loaded successfully');

  } catch (err) {
    console.error('Failed to load state:', err);
  }
}

// ======================
// SAVE STATE (SAFE)
// ======================

async function saveState() {
  if (saveInProgress) return;
  saveInProgress = true;

  try {
    await chrome.storage.local.set({
      focusState: {
        active: focusState.active,
        hiddenTabs: focusState.hiddenTabs
      },
      timerState: timerState
    });
  } catch (err) {
    console.error('Failed to save state:', err);
  } finally {
    saveInProgress = false;
  }
}

// ======================
// BLACKLIST FUNCTIONS
// ======================

async function getBlacklist() {
  try {
    const data = await chrome.storage.local.get(['blacklist']);
    cachedBlacklist = Array.isArray(data.blacklist) ? data.blacklist : [];
    return cachedBlacklist;
  } catch (err) {
    console.error('Failed to get blacklist:', err);
    return cachedBlacklist;
  }
}

async function addToBlacklist(site) {
  const cleanSite = site?.toLowerCase().trim();
  if (!cleanSite) return false;

  const blacklist = await getBlacklist();
  if (blacklist.includes(cleanSite)) return false;

  blacklist.push(cleanSite);
  cachedBlacklist = blacklist;
  await chrome.storage.local.set({ blacklist });

  return true;
}

async function removeFromBlacklist(site) {
  const blacklist = await getBlacklist();
  const updated = blacklist.filter(s => s !== site);
  cachedBlacklist = updated;
  await chrome.storage.local.set({ blacklist: updated });
  return true;
}

// ======================
// MESSAGE HANDLER
// ======================

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  (async () => {
    try {
      switch (req.action) {

        case 'get_blacklist':
          sendResponse({ blacklist: await getBlacklist() });
          break;

        case 'add_to_blacklist':
          sendResponse({
            success: await addToBlacklist(req.site),
            blacklist: await getBlacklist()
          });
          break;

        case 'remove_from_blacklist':
          sendResponse({
            success: await removeFromBlacklist(req.site),
            blacklist: await getBlacklist()
          });
          break;

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

        case 'start_work_timer':
          await startWorkTimer(req.minutes, req.autoContinue);
          sendResponse({ success: true });
          break;

        case 'start_break_timer':
          await startBreakTimer(req.minutes, req.autoContinue);
          sendResponse({ success: true });
          break;

        case 'stop_timer':
          await stopTimer();
          sendResponse({ success: true });
          break;

        case 'set_auto_continue':
          timerState.autoContinue = req.enabled;
          await saveState();
          sendResponse({ success: true });
          break;

        case 'get_current_tab':
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            try {
              const u = new URL(tabs[0].url);
              sendResponse({ hostname: u.hostname, url: tabs[0].url });
            } catch {
              sendResponse({ hostname: '', url: '' });
            }
          });
          return;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('Message handler error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});

// ======================
// FOCUS MODE
// ======================

async function startFocusMode() {
  if (focusState.active) return;

  const blacklist = cachedBlacklist.length ? cachedBlacklist : await getBlacklist();
  const tabs = await chrome.tabs.query({});
  const tabsToHide = [];

  for (const tab of tabs) {
    if (!tab.url) continue;
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url === 'about:blank') continue;

    try {
      const hostname = new URL(tab.url).hostname.toLowerCase();
      if (blacklist.some(site => hostname.includes(site))) {
        tabsToHide.push(tab);
      }
    } catch {}
  }

  focusState.hiddenTabs = tabsToHide.map(tab => ({
    url: tab.url,
    title: tab.title
  }));

  for (const tab of tabsToHide) {
    try { await chrome.tabs.remove(tab.id); } catch {}
  }

  focusState.active = true;
  await saveState();
  startNavigationMonitoring();
  updateIcon();

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Focus Mode Started',
    message: `Blocked ${tabsToHide.length} distracting tabs`
  });
}

async function stopFocusMode() {
  if (!focusState.active) return;

  for (const tab of focusState.hiddenTabs) {
    try { await chrome.tabs.create({ url: tab.url, active: false }); } catch {}
  }

  focusState.active = false;
  focusState.hiddenTabs = [];
  await saveState();
  stopNavigationMonitoring();
  updateIcon();

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Focus Mode Ended',
    message: 'All tabs have been restored'
  });
}

// ======================
// TIMER
// ======================

async function startWorkTimer(minutes, autoContinue = false) {
  await stopTimer();

  timerState = {
    active: true,
    mode: 'work',
    duration: minutes,
    startTime: Date.now(),
    endTime: Date.now() + minutes * 60000,
    autoContinue
  };

  await saveState();
  await startFocusMode();
  scheduleAlarm(minutes);
  updateIcon();
}

async function startBreakTimer(minutes, autoContinue = false) {
  await stopTimer();

  timerState = {
    active: true,
    mode: 'break',
    duration: minutes,
    startTime: Date.now(),
    endTime: Date.now() + minutes * 60000,
    autoContinue
  };

  await saveState();
  if (focusState.active) await stopFocusMode();
  scheduleAlarm(minutes);
  updateIcon();
}

async function stopTimer() {
  timerState.active = false;
  timerState.mode = null;
  timerState.endTime = null;
  await saveState();
  chrome.alarms.clear('focus_tab_timer_end');
  updateIcon();
}

function scheduleAlarm(minutes) {
  chrome.alarms.create('focus_tab_timer_end', { delayInMinutes: minutes });
}

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'focus_tab_timer_end') {
    await handleTimerEnd();
  }
});

async function handleTimerEnd() {
  if (!timerState.active) return;

  const wasWork = timerState.mode === 'work';
  const auto = timerState.autoContinue;

  timerState.active = false;
  timerState.mode = null;
  timerState.endTime = null;
  await saveState();
  updateIcon();

  if (auto) {
    setTimeout(() => {
      wasWork ? startBreakTimer(5, true) : startWorkTimer(25, true);
    }, 2000);
  }
}

// ======================
// ICON
// ======================

function updateIcon() {
  if (timerState.active && timerState.endTime) {
    const mins = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 60000));
    chrome.action.setBadgeText({ text: mins.toString() });
    chrome.action.setBadgeBackgroundColor({
      color: timerState.mode === 'work' ? '#4CAF50' : '#2196F3'
    });
  } else if (focusState.active) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ======================
// NAVIGATION BLOCKING
// ======================

let navigationListener = null;

function startNavigationMonitoring() {
  if (navigationListener) return;

  navigationListener = async details => {
    if (!focusState.active) return;

    try {
      const url = new URL(details.url);
      if (['chrome:', 'chrome-extension:', 'about:'].includes(url.protocol)) return;

      const hostname = url.hostname.toLowerCase();
      if (cachedBlacklist.some(site => hostname.includes(site))) {
        await chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL(`warning.html?site=${encodeURIComponent(hostname)}`)
        });
      }
    } catch {}
  };

  chrome.webNavigation.onBeforeNavigate.addListener(navigationListener);
}

function stopNavigationMonitoring() {
  if (navigationListener) {
    chrome.webNavigation.onBeforeNavigate.removeListener(navigationListener);
    navigationListener = null;
  }
}

// ======================
// PERIODIC UPDATES
// ======================

setInterval(() => {
  if (timerState.active) updateIcon();
}, 30000);

setInterval(async () => {
  if (focusState.active || timerState.active) {
    await saveState();
  }
}, 60000);
