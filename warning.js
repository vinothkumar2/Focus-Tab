// Motivational quotes
const quotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Stay focused, go after your dreams and keep moving toward your goals. - LL Cool J",
  "Concentrate all your thoughts upon the work at hand. - Alexander Graham Bell",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "Your focus determines your reality. - George Lucas",
  "One day or day one. You decide.",
  "The secret of getting ahead is getting started. - Mark Twain",
  "Productivity is never an accident. - Paul J. Meyer",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Focus on being productive instead of busy. - Tim Ferriss"
];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get('site');

// Display site name
if (site) {
  document.getElementById('siteName').textContent = site;
}

// Show random quote
function showRandomQuote() {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('quote').textContent = randomQuote;
}

// Check for custom message
chrome.storage.local.get('customWarningMessage', (data) => {
  if (data.customWarningMessage) {
    document.getElementById('quote').textContent = data.customWarningMessage;
  } else {
    showRandomQuote();
  }
});

// Update timer display
function updateTimerDisplay() {
  chrome.runtime.sendMessage({ action: 'get_session_status' }, (response) => {
    const timerInfo = document.getElementById('timerInfo');
    
    if (response && response.timerActive && response.timerMode === 'work') {
      timerInfo.style.display = 'block';
      
      const updateTime = () => {
        if (response.timerActive && response.timerEndTime) {
          const remaining = response.timerEndTime - Date.now();
          
          if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            document.getElementById('remainingTime').textContent = 
              `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            timerInfo.style.display = 'none';
          }
        }
      };
      
      updateTime();
      const timerInterval = setInterval(updateTime, 1000);
      
      // Clean up interval when page is closed
      window.addEventListener('beforeunload', () => {
        clearInterval(timerInterval);
      });
    } else {
      timerInfo.style.display = 'none';
    }
  });
}

// Initialize timer display
updateTimerDisplay();

// Update timer every 5 seconds
setInterval(updateTimerDisplay, 5000);

// Go back button
document.getElementById('goBack').addEventListener('click', () => {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = 'chrome://newtab';
  }
});

// Auto-refresh quotes every 15 seconds
setInterval(() => {
  chrome.storage.local.get('customWarningMessage', (data) => {
    if (!data.customWarningMessage) {
      showRandomQuote();
    }
  });
}, 15000);
