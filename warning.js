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

// Show random quote initially
showRandomQuote();

// Refresh quote every 10 seconds
setInterval(showRandomQuote, 10000);

// Go back button
document.getElementById('goBack').addEventListener('click', () => {
    // Try to go back in history
    if (history.length > 1) {
        history.back();
    } else {
        // If no history, try to go to a safe page
        window.location.href = 'chrome://newtab';
    }
});

// Try to get custom message from storage
chrome.storage.local.get('customWarningMessage', (data) => {
    if (data.customWarningMessage) {
        document.getElementById('quote').textContent = data.customWarningMessage;
    }
});
