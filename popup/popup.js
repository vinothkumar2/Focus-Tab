document.addEventListener("DOMContentLoaded", async () => {
  const siteListEl = document.getElementById("site-list");
  const addButton = document.getElementById("add-button");
  const siteInput = document.getElementById("site-input");
  const hideTabsButton = document.getElementById("hideTabs");
  const restoreTabsButton = document.getElementById("restoreTabs");
  const addCurrentSiteButton = document.getElementById("addCurrentSite");
  const customMessageInput = document.getElementById('custom-message');
  const saveMessageBtn = document.getElementById('save-message');
  const sessionStatus = document.getElementById('sessionStatus');
  const currentSiteInfo = document.getElementById('currentSiteInfo');
  const currentSiteName = document.getElementById('currentSiteName');

  let blacklistSites = [];
  let isFocusModeActive = false;

  // Load data from storage
  chrome.storage.local.get(["blacklistSites", "customWarningMessage", "hiddenTabs"], (data) => {
    blacklistSites = data.blacklistSites || [];
    renderSiteList();
    
    if (data.customWarningMessage) {
      customMessageInput.value = data.customWarningMessage;
    }
    
    // Check if focus mode is active
    isFocusModeActive = data.hiddenTabs && data.hiddenTabs.length > 0;
    updateSessionStatus();
  });

  // Get current site info
  updateCurrentSiteInfo();

  // Add site button click
  addButton.addEventListener("click", () => {
    const newSite = siteInput.value.trim().toLowerCase();
    if (newSite) {
      addSiteToBlacklist(newSite);
      siteInput.value = "";
    }
  });

  // Enter key to add site
  siteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addButton.click();
    }
  });

  // Add current site button
  addCurrentSiteButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({action: "get_active_tab"}, (response) => {
      if (response && response.hostname) {
        addSiteToBlacklist(response.hostname);
      } else {
        alert("Could not get current site information. Make sure you're on a valid webpage.");
      }
    });
  });

  // Remove site
  siteListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const siteToRemove = e.target.dataset.site;
      blacklistSites = blacklistSites.filter(site => site !== siteToRemove);
      saveBlacklist();
      renderSiteList();
    }
  });

  function addSiteToBlacklist(site) {
    // Clean the site URL
    let cleanSite = site.toLowerCase().trim();
    cleanSite = cleanSite.replace('https://', '').replace('http://', '').replace('www.', '');
    
    if (cleanSite && !blacklistSites.includes(cleanSite)) {
      blacklistSites.push(cleanSite);
      saveBlacklist();
      renderSiteList();
    }
  }

  function renderSiteList() {
    siteListEl.innerHTML = "";
    if (blacklistSites.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No sites in blacklist. Add some to get started!";
      li.style.textAlign = "center";
      li.style.opacity = "0.7";
      li.style.fontStyle = "italic";
      siteListEl.appendChild(li);
    } else {
      blacklistSites.forEach(site => {
        const li = document.createElement("li");
        
        const siteSpan = document.createElement("span");
        siteSpan.textContent = site;
        siteSpan.style.flex = "1";
        siteSpan.style.overflow = "hidden";
        siteSpan.style.textOverflow = "ellipsis";
        
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("remove-btn");
        removeBtn.setAttribute("data-site", site);
        removeBtn.title = "Remove from blacklist";

        li.appendChild(siteSpan);
        li.appendChild(removeBtn);
        siteListEl.appendChild(li);
      });
    }
  }

  function saveBlacklist() {
    chrome.storage.local.set({ blacklistSites: blacklistSites });
  }

  function updateSessionStatus() {
    if (isFocusModeActive) {
      sessionStatus.textContent = "Focus mode is ACTIVE";
      sessionStatus.className = "session-info active";
      hideTabsButton.style.display = "none";
      restoreTabsButton.style.display = "flex";
    } else {
      sessionStatus.textContent = "Focus mode is not active";
      sessionStatus.className = "session-info";
      hideTabsButton.style.display = "flex";
      restoreTabsButton.style.display = "none";
    }
  }

  function updateCurrentSiteInfo() {
    chrome.runtime.sendMessage({action: "get_active_tab"}, (response) => {
      if (response && response.hostname) {
        currentSiteInfo.style.display = "block";
        currentSiteName.textContent = response.hostname;
      } else {
        currentSiteInfo.style.display = "none";
      }
    });
  }

  // Start focus session
  hideTabsButton.addEventListener("click", () => {
    if (blacklistSites.length === 0) {
      alert("Please add at least one site to your blacklist first!");
      return;
    }
    
    chrome.runtime.sendMessage({ action: "hide_tabs" }, () => {
      isFocusModeActive = true;
      updateSessionStatus();
      window.close(); // Close popup after starting
    });
  });

  // End focus session
  restoreTabsButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "restore_tabs" }, () => {
      isFocusModeActive = false;
      updateSessionStatus();
      window.close(); // Close popup after ending
    });
  });

  // Save custom message
  saveMessageBtn.addEventListener('click', () => {
    const message = customMessageInput.value.trim();
    if (message) {
      chrome.storage.local.set({ customWarningMessage: message });
      saveMessageBtn.textContent = 'Saved!';
      saveMessageBtn.classList.add('saved');
      setTimeout(() => {
        saveMessageBtn.textContent = 'Save Message';
        saveMessageBtn.classList.remove('saved');
      }, 2000);
    }
  });

  // Auto-update current site info when popup is opened
  updateCurrentSiteInfo();
});
