let hiddenTabs = [];
let workModeActive = false;

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "hide_tabs") {
    workModeActive = true;
    
    chrome.tabs.query({}, (tabs) => {
      chrome.storage.local.get(["blacklistSites"], (data) => {
        const blacklist = data.blacklistSites || [];

        const distracting = tabs.filter(tab => {
          if (!tab.url) return false;
          
          // Skip chrome:// pages and extension pages
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return false;
          }
          
          try {
            const urlObj = new URL(tab.url);
            const hostname = urlObj.hostname.replace('www.', '');
            
            return blacklist.some(site => {
              const cleanSite = site.replace('www.', '').replace('https://', '').replace('http://', '');
              return hostname.includes(cleanSite) || cleanSite.includes(hostname);
            });
          } catch (e) {
            return false;
          }
        });

        hiddenTabs = distracting.map(tab => ({
          url: tab.url,
          title: tab.title,
          id: tab.id
        }));
        chrome.storage.local.set({ hiddenTabs });

        distracting.forEach(tab => {
          chrome.tabs.remove(tab.id);
        });
        
        // Start monitoring navigation
        startNavigationMonitoring();
      });
    });
  }

  if (msg.action === "restore_tabs") {
    restoreTabs();
  }
  
  if (msg.action === "get_active_tab") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        try {
          const url = new URL(tabs[0].url);
          const hostname = url.hostname.replace('www.', '');
          sendResponse({url: tabs[0].url, hostname: hostname});
        } catch (e) {
          sendResponse({url: tabs[0].url, hostname: ''});
        }
      } else {
        sendResponse(null);
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Reopen saved hidden tabs
function restoreTabs() {
  chrome.storage.local.get("hiddenTabs", (data) => {
    if (data.hiddenTabs) {
      data.hiddenTabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url });
      });
      chrome.storage.local.remove("hiddenTabs");
    }
    workModeActive = false;
    stopNavigationMonitoring();
  });
}

// Start monitoring navigation to blocked sites
function startNavigationMonitoring() {
  chrome.webNavigation.onBeforeNavigate.addListener(handleNavigationAttempt);
}

// Stop monitoring navigation
function stopNavigationMonitoring() {
  chrome.webNavigation.onBeforeNavigate.removeListener(handleNavigationAttempt);
}

// Handle navigation attempts during work mode
async function handleNavigationAttempt(details) {
  if (!workModeActive) return;
  
  try {
    const url = new URL(details.url);
    const hostname = url.hostname.replace('www.', '');
    
    // Skip chrome:// pages and extension pages
    if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
      return;
    }
    
    // Check if site is blocked
    const data = await chrome.storage.local.get(["blacklistSites"]);
    const blacklist = data.blacklistSites || [];
    
    const isBlocked = blacklist.some(site => {
      const cleanSite = site.replace('www.', '').replace('https://', '').replace('http://', '');
      return hostname.includes(cleanSite) || cleanSite.includes(hostname);
    });
    
    if (isBlocked) {
      // Block the navigation and show warning
      chrome.tabs.update(details.tabId, { 
        url: chrome.runtime.getURL(`warning.html?site=${encodeURIComponent(hostname)}`) 
      });
    }
  } catch (e) {
    console.error("Navigation error:", e);
  }
}

// Initialize
chrome.runtime.onStartup.addListener(() => {
  workModeActive = false;
});
